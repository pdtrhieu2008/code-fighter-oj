import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Users,
  Code2,
  FileCheck,
  Swords,
  GraduationCap,
  UsersRound,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, getAcceptanceRate } from "@/lib/utils";

export default async function AdminOverviewPage() {
  // Fetch real database metrics
  const [
    totalUsers,
    totalStudents,
    totalInstructors,
    totalGroups,
    totalProblems,
    totalSubmissions,
    acceptedSubmissions,
    totalContests,
    recentSubmissions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "INSTRUCTOR" } }),
    prisma.group.count({ where: { status: "ACTIVE" } }),
    prisma.problem.count({ where: { deletedAt: null } }),
    prisma.submission.count(),
    prisma.submission.count({ where: { verdict: "ACCEPTED" } }),
    prisma.contest.count(),
    prisma.submission.findMany({
      take: 8,
      orderBy: { submittedAt: "desc" },
      include: {
        problem: { select: { title: true, slug: true } },
        user: {
          select: {
            email: true,
            fighterProfile: { select: { username: true, fighterId: true } },
          },
        },
      },
    }),
  ]);

  const acRate = getAcceptanceRate(acceptedSubmissions, totalSubmissions);

  const STATS = [
    { label: "Tổng Người Dùng", value: totalUsers, icon: Users, color: "text-blue-400" },
    { label: "Võ Sĩ Học Viện", value: totalStudents, icon: GraduationCap, color: "text-emerald-400" },
    { label: "Huấn Luyện Viên", value: totalInstructors, icon: Users, color: "text-amber-400" },
    { label: "Tổng Bài Tập", value: totalProblems, icon: Code2, color: "text-[#E63946]" },
    { label: "Lượt Nộp Bài", value: totalSubmissions, icon: FileCheck, color: "text-purple-400" },
    { label: "Tỉ Lệ AC Chung", value: acRate, icon: TrendingUp, color: "text-emerald-400" },
    { label: "Giải Đấu (Contest)", value: totalContests, icon: Swords, color: "text-amber-400" },
    { label: "Lớp & Nhóm", value: totalGroups, icon: UsersRound, color: "text-cyan-400" },
  ];

  return (
    <div className="space-y-8">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
            Tổng Quan Hệ Thống
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Trung tâm kiểm soát số liệu thời gian thực của Code Fighter OJ.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/problems/create">
            <Button variant="fighter" size="sm" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Thêm Bài Tập
            </Button>
          </Link>
          <Link href="/admin/contests">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs border-neutral-700">
              <Plus className="h-3.5 w-3.5 text-amber-400" /> Quản Lý Giải Đấu
            </Button>
          </Link>
        </div>
      </div>

      {/* Real Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-neutral-800 bg-[#16181D] p-5 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-neutral-400 uppercase">
                  {stat.label}
                </span>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-xl border border-neutral-800 bg-[#16181D] overflow-hidden">
        <div className="p-4 bg-neutral-900/60 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Lượt Nộp Bài Gần Đây Nhất</h2>
          <Link href="/submissions" className="text-xs font-mono text-[#E63946] hover:underline flex items-center gap-1">
            Xem tất cả <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-neutral-800">
              <TableHead className="w-16 font-mono text-center">ID</TableHead>
              <TableHead>Võ Sĩ</TableHead>
              <TableHead>Bài Tập</TableHead>
              <TableHead>Ngôn Ngữ</TableHead>
              <TableHead>Phán Quyết</TableHead>
              <TableHead className="text-right">Thời Gian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentSubmissions.length > 0 ? (
              recentSubmissions.map((sub) => {
                const username =
                  sub.user.fighterProfile?.username || sub.user.email.split("@")[0];
                return (
                  <TableRow key={sub.id} className="border-neutral-800">
                    <TableCell className="font-mono text-xs text-neutral-500 text-center">
                      {sub.id.slice(-6)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-white">
                      {username}
                    </TableCell>
                    <TableCell className="text-xs text-neutral-200">
                      {sub.problem.title}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-neutral-400">
                      {sub.language}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          sub.verdict === "ACCEPTED"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                            : sub.verdict === "WRONG_ANSWER"
                            ? "bg-red-950 text-red-400 border border-red-900"
                            : "bg-amber-950 text-amber-400 border border-amber-900"
                        }
                      >
                        {sub.verdict}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-neutral-500">
                      {formatDate(sub.submittedAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-neutral-500">
                  Chưa có lượt nộp bài nào trên hệ thống.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
