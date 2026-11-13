import React from "react";
import { prisma } from "@/lib/prisma";
import { UserManager } from "./UserManager";
import { Prisma, Role } from "@prisma/client";

interface Props {
  searchParams: Promise<{
    search?: string;
    role?: string;
    page?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const search = params.search?.trim() || "";
  const roleParam = params.role;
  const role = roleParam && Object.values(Role).includes(roleParam as Role) ? roleParam as Role : undefined;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const pageSize = 50;

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

  const [users, totalUsers] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        userProfile: true,
        fighterProfile: true,
        userBelts: {
          orderBy: { awardedAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.user.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
          Quản Lý Người Dùng & Võ Sĩ
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Theo dõi danh sách môn sinh, phân quyền HLV / Admin và điều chỉnh tư cách thành viên.
        </p>
      </div>

      <UserManager
        initialUsers={users}
        currentSearch={search}
        currentRole={role || "ALL"}
        currentPage={page}
        totalPages={totalPages}
        totalUsers={totalUsers}
      />
    </div>
  );
}
