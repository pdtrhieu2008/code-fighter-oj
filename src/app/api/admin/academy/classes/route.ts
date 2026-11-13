import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

const createClassSchema = z.object({
  name: z.string().min(3, "Tên lớp tối thiểu 3 ký tự").max(100),
  description: z.string().max(2000).optional(),
  courseId: z.string().cuid("Khóa học không hợp lệ").optional().nullable(),
  instructorId: z.string().cuid("Huấn luyện viên không hợp lệ").optional().nullable(),
  startDate: z.string().datetime("Ngày bắt đầu không hợp lệ").optional().nullable(),
  endDate: z.string().datetime("Ngày kết thúc không hợp lệ").optional().nullable(),
  maxStudents: z.number().int().positive("Số học viên tối đa phải là số dương").max(1000).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const parsed = createClassSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dữ liệu lớp học không hợp lệ." },
        { status: 400 }
      );
    }
    const { name, description, courseId, instructorId, startDate, endDate, maxStudents } = parsed.data;

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json({ error: "Ngày kết thúc phải sau ngày bắt đầu." }, { status: 400 });
    }

    if (courseId) {
      const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
      if (!course) {
        return NextResponse.json({ error: "Khóa học không tồn tại." }, { status: 400 });
      }
    }

    if (instructorId) {
      const instructor = await prisma.user.findUnique({
        where: { id: instructorId },
        select: { id: true, role: true },
      });
      if (!instructor || !["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"].includes(instructor.role)) {
        return NextResponse.json(
          { error: "Huấn luyện viên phải là tài khoản INSTRUCTOR/ADMIN." },
          { status: 400 }
        );
      }
    }

    const newClass = await prisma.$transaction(async (tx) => {
      const created = await tx.class.create({
        data: {
          name,
          description: description ?? null,
          courseId: courseId ?? null,
          instructorId: instructorId ?? null,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          maxStudents: maxStudents ?? null,
        },
        select: { id: true, name: true },
      });
      await tx.auditLog.create({
        data: {
          actorId: admin.id!,
          action: "ACADEMY_CLASS_CREATE",
          targetType: "Class",
          targetId: created.id,
          metadata: { name, courseId: courseId ?? null },
        },
      });
      return created;
    });

    return NextResponse.json({ message: "Tạo lớp học thành công!", class: newClass }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "Không có quyền thực hiện." }, { status: 403 });
    }
    console.error("Academy class create error:", error);
    return NextResponse.json({ error: "Không thể tạo lớp học." }, { status: 500 });
  }
}
