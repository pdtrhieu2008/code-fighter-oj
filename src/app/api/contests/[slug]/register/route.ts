import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await requireAuth();
    const { slug } = await params;

    const contest = await prisma.contest.findUnique({
      where: { slug },
    });

    if (!contest) {
      return NextResponse.json({ error: "Giải đấu không tồn tại." }, { status: 404 });
    }

    if (contest.status === "ENDED" || contest.status === "ARCHIVED") {
      return NextResponse.json({ error: "Giải đấu đã kết thúc." }, { status: 400 });
    }

    // Check if already registered
    const existing = await prisma.contestParticipant.findUnique({
      where: {
        contestId_userId: {
          contestId: contest.id,
          userId: user.id!,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: "Bạn đã đăng ký tham gia giải đấu này rồi." });
    }

    await prisma.contestParticipant.create({
      data: {
        contestId: contest.id,
        userId: user.id!,
      },
    });

    return NextResponse.json(
      { message: "Đăng ký tham gia giải đấu thành công!" },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Vui lòng đăng nhập để đăng ký giải đấu." }, { status: 401 });
    }
    console.error("Contest Register Error:", error);
    return NextResponse.json({ error: "Lỗi đăng ký tham gia giải đấu." }, { status: 500 });
  }
}
