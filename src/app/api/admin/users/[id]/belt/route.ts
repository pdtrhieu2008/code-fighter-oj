import { NextResponse } from "next/server";
import { z } from "zod";
import { BeltColor, BeltLevel, PromotionType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

const promotionSchema = z.object({
  beltColor: z.nativeEnum(BeltColor),
  beltLevel: z.nativeEnum(BeltLevel),
  reason: z.string().trim().min(3).max(500),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const parsed = promotionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Thông tin đai không hợp lệ." }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const student = await tx.user.findUnique({
        where: { id },
        select: { id: true, userBelts: { orderBy: { awardedAt: "desc" }, take: 1, select: { beltColor: true, beltLevel: true } } },
      });
      if (!student) return null;

      const previous = student.userBelts[0] ?? null;
      const belt = await tx.userBelt.create({
        data: { userId: id, beltColor: parsed.data.beltColor, beltLevel: parsed.data.beltLevel, awardedBy: admin.id, notes: parsed.data.reason },
      });
      await tx.promotionHistory.create({
        data: {
          userId: id,
          fromBeltColor: previous?.beltColor ?? null,
          fromBeltLevel: previous?.beltLevel ?? null,
          toBeltColor: parsed.data.beltColor,
          toBeltLevel: parsed.data.beltLevel,
          promotedBy: admin.id,
          reason: parsed.data.reason,
          type: PromotionType.MANUAL,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "STUDENT_BELT_AWARDED",
          targetType: "User",
          targetId: id,
          metadata: { previousBelt: previous, newBelt: { beltColor: parsed.data.beltColor, beltLevel: parsed.data.beltLevel }, reason: parsed.data.reason },
        },
      });
      return belt;
    });

    if (!updated) return NextResponse.json({ error: "Không tìm thấy học viên." }, { status: 404 });
    return NextResponse.json({ message: "Đã ghi nhận cấp đai mới.", belt: updated });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "Không có quyền thực hiện." }, { status: 403 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Award belt failed:", error.code);
    } else {
      console.error("Award belt failed:", error);
    }
    return NextResponse.json({ error: "Không thể cập nhật đai học viên." }, { status: 500 });
  }
}
