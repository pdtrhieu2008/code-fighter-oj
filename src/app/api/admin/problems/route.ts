import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { Difficulty, Visibility } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const {
      title,
      slug,
      statement,
      inputFormat,
      outputFormat,
      constraints,
      difficulty,
      visibility,
      timeLimit,
      memoryLimit,
      supportedLanguages,
      tagIds,
      testCases,
    } = body;

    if (!title || !slug || !statement) {
      return NextResponse.json(
        { error: "Tiêu đề, mã định danh (slug) và đề bài là bắt buộc." },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await prisma.problem.findUnique({
      where: { slug: slug.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Mã định danh (slug) bài tập này đã tồn tại." },
        { status: 400 }
      );
    }

    // Create problem transaction
    const newProblem = await prisma.$transaction(async (tx) => {
      const problem = await tx.problem.create({
        data: {
          title,
          slug: slug.toLowerCase(),
          statement,
          inputFormat: inputFormat || null,
          outputFormat: outputFormat || null,
          constraints: constraints || null,
          difficulty: difficulty || Difficulty.EASY,
          visibility: visibility || Visibility.PUBLIC,
          timeLimit: timeLimit ? parseInt(timeLimit, 10) : 1000,
          memoryLimit: memoryLimit ? parseInt(memoryLimit, 10) : 262144,
          supportedLanguages: supportedLanguages || ["CPP17", "CPP20", "PYTHON3", "JAVA"],
          authorId: admin.id!,
        },
      });

      // Attach tags
      if (Array.isArray(tagIds) && tagIds.length > 0) {
        for (const tagId of tagIds) {
          await tx.problemTag.create({
            data: {
              problemId: problem.id,
              tagId,
            },
          });
        }
      }

      // Create testcases if provided
      if (Array.isArray(testCases) && testCases.length > 0) {
        let order = 1;
        for (const tc of testCases) {
          if (tc.inputData !== undefined && tc.outputData !== undefined) {
            await tx.problemTestCase.create({
              data: {
                problemId: problem.id,
                inputData: tc.inputData,
                outputData: tc.outputData,
                isSample: !!tc.isSample,
                isHidden: !!tc.isHidden,
                points: tc.points ? parseInt(tc.points, 10) : 10,
                orderIndex: order++,
              },
            });
          }
        }
      }

      // Record audit log
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "PROBLEM_CREATE",
          targetType: "Problem",
          targetId: problem.id,
          metadata: { title, slug },
        },
      });

      return problem;
    });

    return NextResponse.json(
      { message: "Tạo bài tập thành công!", problem: newProblem },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Không có quyền thực hiện." }, { status: 403 });
    }
    console.error("Admin Problem Create Error:", error);
    return NextResponse.json(
      { error: "Không thể tạo bài tập mới." },
      { status: 500 }
    );
  }
}
