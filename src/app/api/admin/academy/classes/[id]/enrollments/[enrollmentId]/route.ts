import { NextResponse } from "next/server";
import { z } from "zod";
import { EnrollmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

const updateSchema = z.object({
  status: z.enum(["ACTIVE", "COMPLETED", "DROPPED"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; enrollmentId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id, enrollmentId } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Trạng thái ghi danh không hợp lệ (ACTIVE/COMPLETED/DROPPED)." },
        { status: 400 }
      );
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true, classId: true, userId: true, status: true },
    });
    if (!enrollment || enrollment.classId !== id) {
      return NextResponse.json({ error: "Bản ghi danh không tồn tại." }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: parsed.data.status,
          ...(parsed.data.status === "COMPLETED" ? { completedAt: new Date() } : { completedAt: null }),
        },
        select: { id: true, status: true, completedAt: true },
      });
      await tx.auditLog.create({
        data: {
          actorId: admin.id!,
          action: "ACADEMY_ENROLL_STATUS_UPDATE",
          targetType: "Enrollment",
          targetId: enrollmentId,
          metadata: { from: enrollment.status, to: parsed.data.status, classId: id },
        },
      });
      return result;
    });

    return NextResponse.json({ enrollment: updated });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "Không có quyền thực hiện." }, { status: 403 });
    }
    console.error("Academy enrollment update error:", error);
    return NextResponse.json({ error: "Không thể cập nhật trạng thái ghi danh." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; enrollmentId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id, enrollmentId } = await params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true, classId: true },
    });
    if (!enrollment || enrollment.classId !== id) {
      return NextResponse.json({ error: "Bản ghi danh không tồn tại." }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.enrollment.delete({ where: { id: enrollmentId } });
      await tx.auditLog.create({
        data: {
          actorId: admin.id!,
          action: "ACADEMY_ENROLL_REMOVE",
          targetType: "Enrollment",
          targetId: enrollmentId,
          metadata: { classId: id },
        },
      });
    });

    return NextResponse.json({ message: "Đã xóa bản ghi danh khỏi lớp." });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "Không có quyền thực hiện." }, { status: 403 });
    }
    console.error("Academy enrollment delete error:", error);
    return NextResponse.json({ error: "Không thể xóa bản ghi danh." }, { status: 500 });
  }
}
