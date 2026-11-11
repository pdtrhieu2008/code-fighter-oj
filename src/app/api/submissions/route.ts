import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Visibility, Verdict } from "@prisma/client";
import axios from "axios";
import { JUDGE0_LANGUAGE_IDS, JUDGE0_SANDBOX_OPTIONS, MAX_SOURCE_LENGTH, mapJudge0Verdict, outputsMatch, rewardForDifficulty, PRISMA_LANGUAGES } from "@/lib/judge";

const submissionSchema = z.object({
  problemId: z.string().min(1).max(64),
  sourceCode: z.string().min(1).max(MAX_SOURCE_LENGTH),
  language: z.enum(["CPP17", "CPP20", "PYTHON3", "JAVA"]),
});

const JUDGE_TIMEOUT_MS = 30_000;

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để nộp bài." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body phải là JSON hợp lệ." }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu nộp bài không hợp lệ.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { problemId, sourceCode, language } = parsed.data;
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    select: {
      id: true,
      title: true,
      difficulty: true,
      visibility: true,
      deletedAt: true,
      timeLimit: true,
      memoryLimit: true,
      testCases: {
        where: { isHidden: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!problem || problem.deletedAt || problem.visibility !== Visibility.PUBLIC) {
    return NextResponse.json({ error: "Bài tập không tồn tại hoặc bạn không có quyền truy cập." }, { status: 404 });
  }
  if (problem.testCases.length === 0) {
    return NextResponse.json({ error: "Bài tập chưa có hidden test case để chấm." }, { status: 409 });
  }

  const judge0Url = process.env.JUDGE0_API_URL;
  if (!judge0Url) {
    return NextResponse.json({ error: "Dịch vụ Judge0 chưa được cấu hình; bài chưa được chấm." }, { status: 503 });
  }

  let judgeAvailable = false;
  try {
    await axios.get(`${judge0Url.replace(/\/$/, "")}/about`, { timeout: 2_000 });
    judgeAvailable = true;
  } catch {
    return NextResponse.json({ error: "Không kết nối được Judge0; bài chưa được chấm." }, { status: 503 });
  }
  if (!judgeAvailable) {
    return NextResponse.json({ error: "Judge0 chưa sẵn sàng." }, { status: 503 });
  }

  const submission = await prisma.submission.create({
    data: {
      userId,
      problemId: problem.id,
      sourceCode,
      language: PRISMA_LANGUAGES[language],
      verdict: "JUDGING",
    },
    select: { id: true },
  });

  let finalVerdict: Verdict = Verdict.ACCEPTED;
  let maxTime = 0;
  let maxMemory = 0;
  let totalScore = 0;
  let compilerOutput: string | undefined;
  let errorMessage: string | undefined;

  try {
    for (const testCase of problem.testCases) {
      const response = await axios.post(
        `${judge0Url.replace(/\/$/, "")}/submissions?wait=true`,
        {
          source_code: sourceCode,
          language_id: JUDGE0_LANGUAGE_IDS[language],
          stdin: testCase.inputData,
          expected_output: testCase.outputData,
          cpu_time_limit: Math.max(0.1, problem.timeLimit / 1000),
          memory_limit: problem.memoryLimit,
          ...JUDGE0_SANDBOX_OPTIONS,
          max_file_size: 2048,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(process.env.JUDGE0_API_KEY ? { "X-Auth-Token": process.env.JUDGE0_API_KEY } : {}),
          },
          timeout: JUDGE_TIMEOUT_MS,
        },
      );
      const result = response.data as {
        status?: { id?: number };
        stdout?: string | null;
        stderr?: string | null;
        compile_output?: string | null;
        message?: string | null;
        time?: string | null;
        memory?: number | null;
      };
      const verdict = mapJudge0Verdict(result.status?.id);
      maxTime = Math.max(maxTime, Math.round(Number(result.time ?? 0) * 1000) || 0);
      maxMemory = Math.max(maxMemory, result.memory ?? 0);
      if (verdict === "ACCEPTED" && !outputsMatch(result.stdout ?? "", testCase.outputData)) {
        finalVerdict = "WRONG_ANSWER";
        break;
      }
      if (verdict !== "ACCEPTED") {
        finalVerdict = verdict;
        compilerOutput = result.compile_output ?? undefined;
        errorMessage = result.stderr ?? result.message ?? undefined;
        break;
      }
      totalScore += testCase.points;
    }
  } catch (error) {
    finalVerdict = "SYSTEM_ERROR";
    errorMessage = axios.isAxiosError(error) && error.code === "ECONNABORTED"
      ? "Judge0 xử lý quá thời gian cho phép."
      : "Không thể hoàn tất quá trình chấm.";
  }

  if (totalScore > 0 && finalVerdict !== "ACCEPTED") finalVerdict = "PARTIAL_SCORE";

  const reward = finalVerdict === "ACCEPTED" ? rewardForDifficulty(problem.difficulty) : 0;
  const expTransactionId = reward > 0 ? `${userId}:${problem.id}` : null;

  await prisma.$transaction(async (tx) => {
    await tx.submission.update({
      where: { id: submission.id },
      data: {
        verdict: finalVerdict,
        score: totalScore,
        executionTime: maxTime,
        memoryUsed: maxMemory,
        compilerOutput,
        errorMessage,
        judgedAt: new Date(),
      },
    });
    await tx.problem.update({
      where: { id: problem.id },
      data: {
        totalSubmissions: { increment: 1 },
        ...(finalVerdict === "ACCEPTED" ? { acceptedSubmissions: { increment: 1 } } : {}),
      },
    });
    await tx.fighterProfile.updateMany({ where: { userId }, data: { totalSubmissions: { increment: 1 } } });

    if (reward > 0 && expTransactionId) {
      const priorReward = await tx.eXPTransaction.findFirst({
        where: { userId, source: "PROBLEM_SOLVED", referenceId: expTransactionId },
        select: { id: true },
      });
      if (!priorReward) {
        await tx.eXPTransaction.create({
          data: { userId, amount: reward, source: "PROBLEM_SOLVED", referenceId: expTransactionId, description: `Vượt qua thử thách: ${problem.title} (+${reward} EXP)` },
        });
        await tx.fighterProfile.updateMany({
          where: { userId },
          data: { totalSolved: { increment: 1 }, acceptedSubmissions: { increment: 1 }, totalExp: { increment: reward } },
        });
      }
    }
  });

  return NextResponse.json({
    submissionId: submission.id,
    verdict: finalVerdict,
    score: totalScore,
    executionTime: maxTime,
    memoryUsed: maxMemory,
    ...(compilerOutput ? { compilerOutput } : {}),
    ...(errorMessage ? { message: errorMessage } : {}),
  }, { status: 201 });
}
