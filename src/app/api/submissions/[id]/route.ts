import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        problem: {
          select: { id: true, title: true, slug: true, timeLimit: true, memoryLimit: true },
        },
        user: {
          select: {
            id: true,
            email: true,
            fighterProfile: { select: { username: true, fighterId: true } },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Lượt nộp bài không tồn tại." }, { status: 404 });
    }

    // Check privacy: If submission is not public and not owner or admin, hide source code
    const isOwner = session?.user?.id === submission.userId;
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes((session?.user as any)?.role);

    const sanitized = {
      ...submission,
      sourceCode: isOwner || isAdmin || submission.isPublic ? submission.sourceCode : null,
    };

    return NextResponse.json({ submission: sanitized });
  } catch (error) {
    console.error("Submission Detail API Error:", error);
    return NextResponse.json({ error: "Lỗi tải thông tin lượt nộp." }, { status: 500 });
  }
}
