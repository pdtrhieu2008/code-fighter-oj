import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireInstructorOrAdmin } from "@/lib/auth-helpers";
import { ContestType, ContestStatus, ScoringType } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as ContestStatus | null;

    const where: any = {};
    if (status && Object.values(ContestStatus).includes(status)) {
      where.status = status;
    }

    const contests = await prisma.contest.findMany({
      where,
      orderBy: { startTime: "desc" },
      include: {
        _count: {
          select: {
            contestProblems: true,
            contestParticipants: true,
          },
        },
      },
    });

    return NextResponse.json({ contests });
  } catch (error) {
    console.error("Contests API Error:", error);
    return NextResponse.json({ error: "Lỗi tải danh sách giải đấu." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireInstructorOrAdmin();
    const body = await req.json();

    const {
      title,
      slug,
      description,
      type,
      scoringType,
      startTime,
      endTime,
      isRated,
      problemIds,
    } = body;

    if (!title || !slug || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Tiêu đề, mã URL (slug), thời gian bắt đầu và kết thúc là bắt buộc." },
        { status: 400 }
      );
    }

    const existing = await prisma.contest.findUnique({
      where: { slug: slug.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Mã định danh (slug) giải đấu đã tồn tại." },
        { status: 400 }
      );
    }

    const contest = await prisma.$transaction(async (tx) => {
      const c = await tx.contest.create({
        data: {
          title,
          slug: slug.toLowerCase(),
          description: description || "",
          type: type || ContestType.PUBLIC,
          scoringType: scoringType || ScoringType.ICPC,
          status: ContestStatus.REGISTRATION,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          isRated: !!isRated,
          createdBy: user.id!,
        },
      });

      // Attach problems if specified
      if (Array.isArray(problemIds) && problemIds.length > 0) {
        let order = 0;
        const labels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
        for (const pid of problemIds) {
          await tx.contestProblem.create({
            data: {
              contestId: c.id,
              problemId: pid,
              orderIndex: order,
              problemLabel: labels[order] || String(order + 1),
              points: 100,
            },
          });
          order++;
        }
      }

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "CONTEST_CREATE",
          targetType: "Contest",
          targetId: c.id,
          metadata: { title, slug },
        },
      });

      return c;
    });

    return NextResponse.json({ message: "Tạo giải đấu thành công!", contest }, { status: 201 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Không có quyền thực hiện." }, { status: 403 });
    }
    console.error("Contest Create Error:", error);
    return NextResponse.json({ error: "Lỗi tạo giải đấu." }, { status: 500 });
  }
}
