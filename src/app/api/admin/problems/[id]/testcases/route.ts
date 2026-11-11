import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const testCases = await prisma.problemTestCase.findMany({
      where: { problemId: id },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json({ testCases });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Không có quyền thực hiện." }, { status: 403 });
    }
    return NextResponse.json({ error: "Lỗi tải danh sách test case." }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    const { inputData, outputData, isSample, isHidden, points, timeLimit, memoryLimit } = body;

    if (inputData === undefined || outputData === undefined) {
      return NextResponse.json(
        { error: "Dữ liệu vào (inputData) và ra (outputData) là bắt buộc." },
        { status: 400 }
      );
    }

    const count = await prisma.problemTestCase.count({ where: { problemId: id } });

    const testCase = await prisma.problemTestCase.create({
      data: {
        problemId: id,
        inputData,
        outputData,
        isSample: !!isSample,
        isHidden: !!isHidden,
        points: points !== undefined ? parseInt(points, 10) : 10,
        timeLimit: timeLimit ? parseInt(timeLimit, 10) : null,
        memoryLimit: memoryLimit ? parseInt(memoryLimit, 10) : null,
        orderIndex: count + 1,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "TESTCASE_CREATE",
        targetType: "ProblemTestCase",
        targetId: testCase.id,
        metadata: { problemId: id, isHidden: testCase.isHidden, points: testCase.points },
      },
    });

    return NextResponse.json(
      { message: "Thêm test case thành công!", testCase },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Không có quyền thực hiện." }, { status: 403 });
    }
    console.error("Testcase Create Error:", error);
    return NextResponse.json({ error: "Lỗi tạo test case." }, { status: 500 });
  }
}
