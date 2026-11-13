import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const existing = await prisma.class.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Lớp học không tồn tại." }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.class.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          actorId: admin.id!,
          action: "ACADEMY_CLASS_DELETE",
          targetType: "Class",
          targetId: id,
          metadata: { name: existing.name },
        },
      });
    });

    return NextResponse.json({ message: `Đã xóa lớp "${existing.name}".` });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "Không có quyền thực hiện." }, { status: 403 });
    }
    console.error("Academy class delete error:", error);
    return NextResponse.json({ error: "Không thể xóa lớp học." }, { status: 500 });
  }
}
