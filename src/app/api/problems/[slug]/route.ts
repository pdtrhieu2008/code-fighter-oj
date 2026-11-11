import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth();

    const problem = await prisma.problem.findUnique({
      where: { slug },
      include: {
        tags: {
          include: { tag: true },
        },
        // SECURITY INVARIANT: Only return sample test cases! Never expose hidden test cases.
        testCases: {
          where: { isSample: true },
          select: {
            id: true,
            inputData: true,
            outputData: true,
            orderIndex: true,
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!problem || problem.deletedAt) {
      return NextResponse.json(
        { error: "Bài tập không tồn tại hoặc đã bị gỡ bỏ." },
        { status: 404 }
      );
    }

    // Check visibility permissions
    if (problem.visibility !== "PUBLIC") {
      const userRole = (session?.user as any)?.role;
      if (!userRole || !["STUDENT", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
        return NextResponse.json(
          { error: "Bài tập này thuộc học viện nội bộ. Bạn cần đăng nhập tài khoản học viên để truy cập." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ problem });
  } catch (error) {
    console.error("Problem Detail API Error:", error);
    return NextResponse.json(
      { error: "Không thể lấy thông tin bài tập." },
      { status: 500 }
    );
  }
}
