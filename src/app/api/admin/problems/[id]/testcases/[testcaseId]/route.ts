import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; testcaseId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id, testcaseId } = await params;

    const testCase = await prisma.problemTestCase.findUnique({
      where: { id: testcaseId },
    });

    if (!testCase || testCase.problemId !== id) {
      return NextResponse.json({ error: "Test case không tồn tại." }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.problemTestCase.delete({ where: { id: testcaseId } }),
      prisma.auditLog.create({
        data: {
          actorId: admin.id,
          action: "TESTCASE_DELETE",
          targetType: "ProblemTestCase",
          targetId: testcaseId,
          metadata: { problemId: id },
        },
      }),
    ]);

    return NextResponse.json({ message: "Xóa test case thành công!" });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Không có quyền thực hiện." }, { status: 403 });
    }
    return NextResponse.json({ error: "Lỗi xóa test case." }, { status: 500 });
  }
}
