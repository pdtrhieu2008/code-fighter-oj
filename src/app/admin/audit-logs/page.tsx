import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ACTION_COLORS: Record<string, string> = {
  CONTEST_CREATE: "bg-amber-950 text-amber-400 border border-amber-900",
  CONTEST_STATUS_UPDATE: "bg-amber-950 text-amber-400 border border-amber-900",
  ACADEMY_CLASS_CREATE: "bg-emerald-950 text-emerald-400 border border-emerald-900",
  ACADEMY_CLASS_DELETE: "bg-red-950 text-red-400 border border-red-900",
  ACADEMY_ENROLL: "bg-emerald-950 text-emerald-400 border border-emerald-900",
  ACADEMY_ENROLL_REACTIVATE: "bg-blue-950 text-blue-400 border border-blue-900",
  ACADEMY_ENROLL_STATUS_UPDATE: "bg-blue-950 text-blue-400 border border-blue-900",
  ACADEMY_ENROLL_REMOVE: "bg-red-950 text-red-400 border border-red-900",
};

export default async function AdminAuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      actor: {
        select: {
          email: true,
          fighterProfile: { select: { username: true, fighterId: true } },
          userProfile: { select: { fullName: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3 border-b border-neutral-800 pb-5">
        <FileText className="h-6 w-6 text-purple-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Nhật Ký Kiểm Toán</h1>
          <p className="mt-1 text-xs text-neutral-400">
            100 thao tác quản trị gần nhất (tạo/xóa lớp, ghi danh, đổi trạng thái contest...).
          </p>
        </div>
      </header>

      <div className="rounded-xl border border-neutral-800 bg-[#16181D] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-800">
              <TableHead className="w-40">Thời Gian</TableHead>
              <TableHead className="w-48">Người Thực Hiện</TableHead>
              <TableHead className="w-64">Hành Động</TableHead>
              <TableHead>Đối Tượng</TableHead>
              <TableHead>Chi Tiết</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-xs text-neutral-500">
                  Chưa có thao tác quản trị nào được ghi lại.
                </TableCell>
              </TableRow>
            )}
            {logs.map((log) => {
              const username = log.actor?.fighterProfile?.username ?? log.actor?.email ?? "—";
              return (
                <TableRow key={log.id} className="border-neutral-800">
                  <TableCell className="font-mono text-xs text-neutral-400">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs text-white">
                    {log.actor?.userProfile?.fullName ?? "—"}
                    <div className="font-mono text-[10px] text-neutral-500">@{username}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`font-mono text-[10px] ${ACTION_COLORS[log.action] ?? "bg-neutral-800 text-neutral-300 border border-neutral-700"}`}
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-neutral-300">
                    {log.targetType}
                    <div className="text-[10px] text-neutral-500">{log.targetId}</div>
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-neutral-500 max-w-xs truncate">
                    {log.metadata ? JSON.stringify(log.metadata) : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <p className="text-[11px] text-neutral-500">
        Link <span className="font-mono">/admin/examinations</span> (Kỳ Thi Thăng Đai) trong sidebar chưa có trang — sẽ triển khai sau, xem{" "}
        <Link href="/admin/academy" className="text-[#E63946] hover:underline">
          Học Viện &amp; Lớp Học
        </Link>{" "}
        để quản lý ghi danh.
      </p>
    </div>
  );
}
