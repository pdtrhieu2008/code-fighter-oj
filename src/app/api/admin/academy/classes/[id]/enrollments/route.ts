import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

const enrollSchema = z
  .object({
    email: z.string().email("Email không hợp lệ").toLowerCase().optional(),
    username: z
      .string()
      .min(3)
      .max(20)
      .regex(/^[a-zA-Z0-9_]+$/, "Tên võ sĩ chỉ chứa chữ cái, số và dấu gạch dưới")
      .optional(),
  })
  .refine((data) => data.email || data.username, {
    message: "Cần cung cấp email hoặc tên võ sĩ để ghi danh.",
  });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = enrollSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dữ liệu ghi danh không hợp lệ." },
        { status: 400 }
      );
    }

    const classRoom = await prisma.class.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        maxStudents: true,
        _count: { select: { enrollments: { where: { status: { in: ["ACTIVE", "COMPLETED"] } } } } },
      },
    });
    if (!classRoom) {
      return NextResponse.json({ error: "Lớp học không tồn tại." }, { status: 404 });
    }

    const user = await prisma.user.findFirst({
      where: parsed.data.email
        ? { email: parsed.data.email }
        : { fighterProfile: { username: (parsed.data.username as string).toLowerCase() } },
      select: {
        id: true,
        email: true,
        fighterProfile: { select: { username: true, fighterId: true } },
        userProfile: { select: { fullName: true } },
      },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy võ sĩ với thông tin đã nhập." },
        { status: 404 }
      );
    }

    const existing = await prisma.enrollment.findUnique({
      where: { classId_userId: { classId: id, userId: user.id } },
      select: { id: true, status: true },
    });
    if (existing) {
      if (existing.status === "ACTIVE") {
        return NextResponse.json(
          { error: "Võ sĩ này đã ở trong lớp với trạng thái ACTIVE." },
          { status: 409 }
        );
      }
      // Re-activate a COMPLETED/DROPPED enrollment instead of failing
      const reactivated = await prisma.enrollment.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", completedAt: null },
        select: { id: true, status: true, userId: true },
      });
      await prisma.auditLog.create({
        data: {
          actorId: admin.id!,
          action: "ACADEMY_ENROLL_REACTIVATE",
          targetType: "Enrollment",
          targetId: reactivated.id,
          metadata: { classId: id, userId: user.id, email: user.email },
        },
      });
      return NextResponse.json({ message: "Đã ghi danh lại võ sĩ vào lớp.", enrollment: reactivated }, { status: 200 });
    }

    if (classRoom.maxStudents && classRoom._count.enrollments >= classRoom.maxStudents) {
      return NextResponse.json(
        { error: `Lớp đã đầy (${classRoom._count.enrollments}/${classRoom.maxStudents} học viên).` },
        { status: 409 }
      );
    }

    const enrollment = await prisma.$transaction(async (tx) => {
      const created = await tx.enrollment.create({
        data: { classId: id, userId: user.id, status: "ACTIVE" },
        select: { id: true, status: true, userId: true, classId: true },
      });
      await tx.auditLog.create({
        data: {
          actorId: admin.id!,
          action: "ACADEMY_ENROLL",
          targetType: "Enrollment",
          targetId: created.id,
          metadata: { classId: id, userId: user.id, email: user.email },
        },
      });
      return created;
    });

    return NextResponse.json(
      { message: `Đã ghi danh ${user.fighterProfile?.username ?? user.email} vào lớp.`, enrollment },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "Không có quyền thực hiện." }, { status: 403 });
    }
    console.error("Academy enroll error:", error);
    return NextResponse.json({ error: "Không thể ghi danh học viên." }, { status: 500 });
  }
}
