import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    const {
      title,
      slug,
      statement,
      inputFormat,
      outputFormat,
      constraints,
      difficulty,
      visibility,
      timeLimit,
      memoryLimit,
    } = body;

    const existing = await prisma.problem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Bài tập không tồn tại." }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const problem = await tx.problem.update({
        where: { id },
        data: {
          title: title ?? existing.title,
          slug: slug ? slug.toLowerCase() : existing.slug,
          statement: statement ?? existing.statement,
          inputFormat: inputFormat !== undefined ? inputFormat : existing.inputFormat,
          outputFormat: outputFormat !== undefined ? outputFormat : existing.outputFormat,
          constraints: constraints !== undefined ? constraints : existing.constraints,
          difficulty: difficulty ?? existing.difficulty,
          visibility: visibility ?? existing.visibility,
          timeLimit: timeLimit ? parseInt(timeLimit, 10) : existing.timeLimit,
          memoryLimit: memoryLimit ? parseInt(memoryLimit, 10) : existing.memoryLimit,
          version: { increment: 1 },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "PROBLEM_UPDATE",
          targetType: "Problem",
          targetId: problem.id,
          metadata: { title: problem.title, version: problem.version },
        },
      });

      return problem;
    });

    return NextResponse.json({ message: "Cập nhật bài tập thành công!", problem: updated });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Không có quyền thực hiện." }, { status: 403 });
    }
    console.error("Admin Problem Update Error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật bài tập." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const existing = await prisma.problem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Bài tập không tồn tại." }, { status: 404 });
    }

    // Soft-delete
    await prisma.$transaction(async (tx) => {
      await tx.problem.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "PROBLEM_DELETE",
          targetType: "Problem",
          targetId: id,
          metadata: { title: existing.title },
        },
      });
    });

    return NextResponse.json({ message: "Xóa bài tập thành công!" });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Không có quyền thực hiện." }, { status: 403 });
    }
    console.error("Admin Problem Delete Error:", error);
    return NextResponse.json({ error: "Lỗi xóa bài tập." }, { status: 500 });
  }
}
