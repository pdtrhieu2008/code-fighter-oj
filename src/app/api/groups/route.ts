import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireInstructorOrAdmin } from "@/lib/auth-helpers";
import { GroupRole, GroupStatus } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();

    // Fetch groups where user is a member or instructor
    const memberGroups = await prisma.groupMember.findMany({
      where: { userId: user.id! },
      include: {
        group: {
          include: {
            instructor: {
              select: {
                id: true,
                email: true,
                userProfile: { select: { fullName: true } },
                fighterProfile: { select: { username: true } },
              },
            },
            _count: {
              select: {
                members: true,
                assignments: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const groups = memberGroups.map((mg) => ({
      ...mg.group,
      memberRole: mg.role,
    }));

    return NextResponse.json({ groups });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }
    console.error("Groups GET Error:", error);
    return NextResponse.json({ error: "Lỗi tải danh sách nhóm." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireInstructorOrAdmin();
    const body = await req.json();

    const { name, slug, description, maxMembers } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Tên lớp và mã định danh (slug) là bắt buộc." },
        { status: 400 }
      );
    }

    // Generate unique 6-character invitation code
    const inviteCode = "CF-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const group = await prisma.$transaction(async (tx) => {
      const g = await tx.group.create({
        data: {
          name,
          slug: slug.toLowerCase(),
          description: description || "",
          inviteCode,
          maxMembers: maxMembers ? parseInt(maxMembers, 10) : 50,
          instructorId: user.id!,
          createdBy: user.id!,
          status: GroupStatus.ACTIVE,
        },
      });

      // Add instructor as owner member
      await tx.groupMember.create({
        data: {
          groupId: g.id,
          userId: user.id!,
          role: GroupRole.OWNER,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "GROUP_CREATE",
          targetType: "Group",
          targetId: g.id,
          metadata: { name, slug, inviteCode },
        },
      });

      return g;
    });

    return NextResponse.json(
      { message: "Khởi tạo lớp học / nhóm thành công!", group },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Không có quyền thực hiện." }, { status: 403 });
    }
    console.error("Groups POST Error:", error);
    return NextResponse.json({ error: "Lỗi tạo nhóm học viện." }, { status: 500 });
  }
}
