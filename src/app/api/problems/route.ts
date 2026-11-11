import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Difficulty, Prisma, Visibility } from "@prisma/client";

export async function GET(req: Request) {
  try {
    await auth();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const difficulty = searchParams.get("difficulty") as Difficulty | null;
    const tagSlug = searchParams.get("tag")?.trim() || "";
    const sort = searchParams.get("sort") || "newest";

    const skip = (page - 1) * limit;

    // Base filter: Guests only see PUBLIC problems. Students can also see enrolled PRIVATE problems.
    const where: Prisma.ProblemWhereInput = {
      visibility: Visibility.PUBLIC,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (difficulty && Object.values(Difficulty).includes(difficulty)) {
      where.difficulty = difficulty;
    }

    if (tagSlug) {
      where.tags = {
        some: {
          tag: {
            slug: tagSlug,
          },
        },
      };
    }

    const orderBy: Prisma.ProblemOrderByWithRelationInput =
      sort === "oldest" ? { createdAt: "asc" } :
      sort === "submissions" ? { totalSubmissions: "desc" } :
      sort === "accepted" ? { acceptedSubmissions: "desc" } :
      { createdAt: "desc" };

    const [total, problems] = await Promise.all([
      prisma.problem.count({ where }),
      prisma.problem.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          slug: true,
          title: true,
          difficulty: true,
          visibility: true,
          timeLimit: true,
          memoryLimit: true,
          totalSubmissions: true,
          acceptedSubmissions: true,
          createdAt: true,
          tags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  color: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      problems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Problems API Error:", error);
    return NextResponse.json(
      { error: "Không thể lấy danh sách bài tập." },
      { status: 500 }
    );
  }
}

