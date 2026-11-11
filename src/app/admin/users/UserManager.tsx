"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BeltBadge } from "@/components/belt/BeltBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Shield, UserCheck, Eye } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface UserItem {
  id: string;
  email: string;
  role: string;
  createdAt: Date | string;
  userProfile?: { fullName: string | null } | null;
  fighterProfile?: { username: string; fighterId: string; rating: number; totalSolved: number } | null;
  userBelts: { beltColor: any; beltLevel: any }[];
}

interface Props {
  initialUsers: UserItem[];
  currentSearch?: string;
  currentRole?: string;
}

const ROLES = ["ALL", "REGISTERED_USER", "STUDENT", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN"];

export function UserManager({ initialUsers, currentSearch = "", currentRole = "ALL" }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [search, setSearch] = useState(currentSearch);
  const [roleFilter, setRoleFilter] = useState(currentRole);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoadingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        router.refresh();
      } else {
        alert("Không thể thay đổi vai trò người dùng.");
      }
    } catch {
      alert("Lỗi kết nối khi cập nhật quyền.");
    } finally {
      setLoadingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.fighterProfile?.username.toLowerCase().includes(search.toLowerCase()) ||
      u.fighterProfile?.fighterId.toLowerCase().includes(search.toLowerCase());

    const matchRole = roleFilter === "ALL" || u.role === roleFilter;

    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo email, tên võ sĩ (@username) hoặc Fighter ID..."
            className="pl-9 bg-neutral-900 border-neutral-800"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {ROLES.map((r) => (
            <Button
              key={r}
              variant={roleFilter === r ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setRoleFilter(r)}
              className="text-xs font-mono"
            >
              {r === "ALL" ? "Tất Cả" : r}
            </Button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-neutral-800 bg-[#16181D] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-800">
              <TableHead className="w-16 font-mono text-center">Đai</TableHead>
              <TableHead>Võ Sĩ (Fighter)</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-36">Vai Trò Hệ Thống</TableHead>
              <TableHead className="w-24 text-right">Rating</TableHead>
              <TableHead className="w-28 text-right">Ngày Tham Gia</TableHead>
              <TableHead className="w-16 text-right">Xem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const belt = user.userBelts[0];
                const fp = user.fighterProfile;
                return (
                  <TableRow key={user.id} className="border-neutral-800">
                    <TableCell className="text-center">
                      {belt ? (
                        <BeltBadge color={belt.beltColor} level={belt.beltLevel} size="sm" />
                      ) : (
                        <span className="text-neutral-600 font-mono text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-white text-xs">
                        {user.userProfile?.fullName || fp?.username || "Chưa đặt tên"}
                      </div>
                      <div className="font-mono text-[11px] text-neutral-500">
                        {fp ? `@${fp.username} (${fp.fighterId})` : "Chưa lập hồ sơ"}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-neutral-400">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <select
                        value={user.role}
                        disabled={loadingId === user.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={`bg-neutral-900 border border-neutral-700 text-xs font-mono rounded px-2 py-1 text-white focus:outline-none ${
                          user.role === "ADMIN" || user.role === "SUPER_ADMIN"
                            ? "border-red-900 text-red-300 font-bold"
                            : user.role === "STUDENT"
                            ? "border-emerald-900 text-emerald-300"
                            : user.role === "INSTRUCTOR"
                            ? "border-amber-900 text-amber-300"
                            : ""
                        }`}
                      >
                        <option value="REGISTERED_USER">REGISTERED_USER</option>
                        <option value="STUDENT">STUDENT (Môn Sinh)</option>
                        <option value="INSTRUCTOR">INSTRUCTOR (HLV)</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-amber-400 font-bold">
                      {fp?.rating ?? 1200}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-neutral-500">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {fp && (
                        <Link href={`/fighters/${fp.username}`} target="_blank">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-white">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-xs text-neutral-500">
                  Không tìm thấy người dùng nào phù hợp.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
