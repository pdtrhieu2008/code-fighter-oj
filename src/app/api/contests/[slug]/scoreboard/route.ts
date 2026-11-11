import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateICPCStandings } from "@/lib/icpc-scoreboard";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const contest = await prisma.contest.findUnique({
      where: { slug },
      include: {
        contestProblems: {
          orderBy: { orderIndex: "asc" },
          include: {
            problem: { select: { id: true, title: true, slug: true } },
          },
        },
        contestParticipants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fighterProfile: {
                  select: { username: true, fighterId: true, rating: true },
                },
              },
            },
          },
        },
      },
    });

    if (!contest) {
      return NextResponse.json({ error: "Giải đấu không tồn tại." }, { status: 404 });
    }

    const problemIds = contest.contestProblems.map((cp) => cp.problemId);

    // Fetch all submissions for this contest's problems within the contest window
    const submissions = await prisma.submission.findMany({
      where: {
        problemId: { in: problemIds },
        submittedAt: {
          gte: contest.startTime,
          lte: contest.endTime,
        },
      },
      select: {
        userId: true,
        problemId: true,
        verdict: true,
        submittedAt: true,
      },
    });

    const problems = contest.contestProblems.map((cp) => ({
      id: cp.problemId,
      problemLabel: cp.problemLabel,
      title: cp.problem.title,
      slug: cp.problem.slug,
    }));

    const participants = contest.contestParticipants.map((cp) => ({
      userId: cp.userId,
      username: cp.user.fighterProfile?.username || cp.user.email.split("@")[0],
      fighterId: cp.user.fighterProfile?.fighterId || "CF-000000",
      rating: cp.user.fighterProfile?.rating || 1200,
    }));

    const standings = calculateICPCStandings(
      contest.startTime,
      problems,
      participants,
      submissions
    );

    return NextResponse.json({
      contest: {
        id: contest.id,
        title: contest.title,
        slug: contest.slug,
        startTime: contest.startTime,
        endTime: contest.endTime,
        status: contest.status,
      },
      problems,
      standings,
    });
  } catch (error) {
    console.error("Scoreboard API Error:", error);
    return NextResponse.json({ error: "Lỗi tính toán bảng điểm." }, { status: 500 });
  }
}
