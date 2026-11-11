import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Difficulty, Prisma, Visibility } from "@prisma/client";
import { ProblemLibrary } from "./ProblemLibrary";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    difficulty?: string;
    tag?: string;
  }>;
}

export default async function ProblemsPage({ searchParams }: PageProps) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const search = params.search?.trim() || "";
  const requestedDifficulty = params.difficulty || "";
  const difficulty = Object.values(Difficulty).includes(requestedDifficulty as Difficulty)
    ? (requestedDifficulty as Difficulty)
    : undefined;
  const tag = params.tag?.trim() || "";
  const where: Prisma.ProblemWhereInput = { visibility: Visibility.PUBLIC, deletedAt: null };
  if (search) where.OR = [
    { title: { contains: search, mode: "insensitive" } },
    { slug: { contains: search, mode: "insensitive" } },
  ];
  if (difficulty) where.difficulty = difficulty;
  if (tag) where.tags = { some: { tag: { slug: tag } } };

  let problems: {
    id: string; slug: string; title: string; difficulty: Difficulty;
    totalSubmissions: number; acceptedSubmissions: number;
    tags: { tag: { id: string; name: string; slug: string; color: string | null } }[];
  }[] = [];
  let tags: { id: string; name: string; slug: string; color: string | null }[] = [];
  let total = 0;
  let queryError = false;
  try {
    const [count, rows, tagRows] = await Promise.all([
      prisma.problem.count({ where }),
      prisma.problem.findMany({
        where, skip: (page - 1) * 20, take: 20, orderBy: { createdAt: "desc" },
        select: {
          id: true, slug: true, title: true, difficulty: true,
          totalSubmissions: true, acceptedSubmissions: true,
          tags: { select: { tag: { select: { id: true, name: true, slug: true, color: true } } } },
        },
      }),
      prisma.tag.findMany({ take: 30, orderBy: { name: "asc" }, select: { id: true, name: true, slug: true, color: true } }),
    ]);
    total = count; problems = rows; tags = tagRows;
  } catch (error) {
    queryError = true;
    console.error("Problem library query failed:", error);
  }
  return <ProblemLibrary initialProblems={problems} initialTags={tags} initialTotal={total}
    initialPage={page} initialSearch={search} initialDifficulty={difficulty ?? ""} initialTag={tag}
    initialError={queryError}
    user={session?.user ? { username: session.user.name ?? undefined } : null} />;
}

