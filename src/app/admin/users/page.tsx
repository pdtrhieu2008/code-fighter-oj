import React from "react";
import { prisma } from "@/lib/prisma";
import { UserManager } from "./UserManager";
import { Role } from "@prisma/client";

interface Props {
  searchParams: Promise<{
    search?: string;
    role?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const search = params.search?.trim() || "";
  const role = params.role as Role | undefined;

  const where: any = {};
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

      <UserManager initialUsers={users} currentSearch={search} currentRole={role || "ALL"} />
    </div>
  );
}
