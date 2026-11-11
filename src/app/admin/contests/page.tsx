import { prisma } from "@/lib/prisma";
import { ContestManager } from "./ContestManager";

export default async function AdminContestsPage() {
  const [contests, problems] = await Promise.all([
    prisma.contest.findMany({
      orderBy: { startTime: "desc" },
      include: { _count: { select: { problems: true, participants: true } } },
    }),
    prisma.problem.findMany({
      where: { deletedAt: null, visibility: "PUBLIC" },
      select: { id: true, title: true, slug: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return <ContestManager
    initialContests={contests.map((contest) => ({
      id: contest.id,
      title: contest.title,
      slug: contest.slug,
      status: contest.status,
      type: contest.type,
      scoringType: contest.scoringType,
      startTime: contest.startTime.toISOString(),
      endTime: contest.endTime.toISOString(),
      participants: contest._count.participants,
      problemCount: contest._count.problems,
    }))}
    problems={problems}
  />;
}
