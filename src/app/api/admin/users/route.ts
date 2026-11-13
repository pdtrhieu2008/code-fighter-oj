import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { Role, Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const role = searchParams.get("role") as Role | null;

    const where: Prisma.UserWhereInput = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { fighterProfile: { username: { contains: search, mode: "insensitive" } } },
        { fighterProfile: { fighterId: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (role && Object.values(Role).includes(role)) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        userProfile: true,
        fighterProfile: true,
        userBelts: {
          orderBy: { awardedAt: "desc" },
          take: 1,
        },
      },
    });

    return NextResponse.json({ users });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ error: "Không có quyền thực hiện." }, { status: 403 });
    }
    return NextResponse.json({ error: "Lỗi tải danh sách người dùng." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role || !Object.values(Role).includes(role)) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    }

    if (admin.id === userId) {
      return NextResponse.json({ error: "Không thể tự thay đổi vai trò của chính mình." }, { status: 403 });
    }
    if (admin.role !== Role.SUPER_ADMIN && role === Role.SUPER_ADMIN) {
      return NextResponse.json({ error: "Chỉ SUPER_ADMIN mới được cấp quyền SUPER_ADMIN." }, { status: 403 });
    }

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!target) {
      return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
    }
    if (admin.role !== Role.SUPER_ADMIN && target.role === Role.SUPER_ADMIN) {
      return NextResponse.json({ error: "ADMIN không được thay đổi quyền của SUPER_ADMIN." }, { status: 403 });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: { role },
      });

      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "USER_ROLE_CHANGE",
          targetType: "User",
          targetId: userId,
          metadata: { previousRole: target.role, newRole: role },
        },
      });

      return u;
    });

    return NextResponse.json({ message: "Cập nhật quyền thành công!", user: updatedUser });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ error: "Không có quyền thực hiện." }, { status: 403 });
    }
    return NextResponse.json({ error: "Lỗi cập nhật người dùng." }, { status: 500 });
  }
}
