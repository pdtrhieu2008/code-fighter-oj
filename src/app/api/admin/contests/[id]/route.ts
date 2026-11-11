import { NextResponse } from "next/server";
import { ContestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

const allowedStatuses = new Set(Object.values(ContestStatus));

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    if (typeof body.status !== "string" || !allowedStatuses.has(body.status as ContestStatus)) {
      return NextResponse.json({ error: "Trạng thái contest không hợp lệ." }, { status: 400 });
    }

    const contest = await prisma.contest.update({
      where: { id },
      data: { status: body.status as ContestStatus },
      select: { id: true, status: true },
    });
    await prisma.auditLog.create({
      data: {
        actorId: user.id!,
        action: "CONTEST_STATUS_UPDATE",
        targetType: "Contest",
        targetId: contest.id,
        metadata: { status: contest.status },
      },
    });
    return NextResponse.json({ contest });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "Không có quyền thực hiện." }, { status: 403 });
    }
    console.error("Admin contest update error:", error);
    return NextResponse.json({ error: "Không thể cập nhật contest." }, { status: 500 });
  }
}
