import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus, Search, Edit, FileCode, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Difficulty, Visibility } from "@prisma/client";

interface Props {
  searchParams: Promise<{
    search?: string;
    difficulty?: string;
    visibility?: string;
  }>;
}

export default async function AdminProblemsPage({ searchParams }: Props) {
  const params = await searchParams;
  const search = params.search?.trim() || "";
  const difficulty = params.difficulty as Difficulty | undefined;
  const visibility = params.visibility as Visibility | undefined;

  const where: any = {
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  if (difficulty && Object.values(Difficulty).includes(difficulty)) {
    where.difficulty = difficulty;
  }

  if (visibility && Object.values(Visibility).includes(visibility)) {
    where.visibility = visibility;
  }

  const problems = await prisma.problem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      tags: { include: { tag: true } },
      _count: { select: { testCases: true, submissions: true } },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
            Quản Lý Bài Tập
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Soạn thảo, quản lý bộ test và cấu hình quyền truy cập bài toán.
          </p>
        </div>

        <Link href="/admin/problems/create">
          <Button variant="fighter" size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Soạn Bài Tập Mới
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-4 flex flex-col sm:flex-row gap-3">
        <form method="GET" action="/admin/problems" className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            name="search"
            defaultValue={search}
            placeholder="Tìm theo tên hoặc slug bài tập..."
            className="pl-9 bg-neutral-900 border-neutral-800"
          />
        </form>

        <div className="flex items-center gap-2">
          <Link href="/admin/problems">
            <Button variant={!difficulty ? "secondary" : "ghost"} size="sm" className="text-xs font-mono">
              Tất Cả
            </Button>
          </Link>
          {["EASY", "MEDIUM", "HARD"].map((d) => (
            <Link key={d} href={`/admin/problems?difficulty=${d}${search ? `&search=${search}` : ""}`}>
              <Button
                variant={difficulty === d ? "secondary" : "ghost"}
                size="sm"
                className="text-xs font-mono"
              >
                {d}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Problems Table */}
      <div className="rounded-xl border border-neutral-800 bg-[#16181D] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-800">
              <TableHead className="w-12 text-center font-mono">#</TableHead>
              <TableHead>Tiêu Đề / Slug</TableHead>
              <TableHead className="w-28">Độ Khó</TableHead>
              <TableHead className="w-24">Hiển Thị</TableHead>
              <TableHead className="w-24 text-center">Test Cases</TableHead>
              <TableHead className="w-24 text-right">Lượt Nộp</TableHead>
              <TableHead className="w-36 text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {problems.length > 0 ? (
              problems.map((prob, idx) => (
                <TableRow key={prob.id} className="border-neutral-800">
                  <TableCell className="font-mono text-xs text-neutral-500 text-center">
                    {idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-white text-xs">{prob.title}</div>
                    <div className="font-mono text-[11px] text-neutral-500">{prob.slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        prob.difficulty === "BEGINNER"
                          ? "bg-neutral-800 text-neutral-300"
                          : prob.difficulty === "EASY"
                          ? "bg-emerald-950 text-emerald-400"
                          : prob.difficulty === "MEDIUM"
                          ? "bg-amber-950 text-amber-400"
                          : "bg-red-950 text-red-400"
                      }
                    >
                      {prob.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        prob.visibility === "PUBLIC"
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/60"
                          : prob.visibility === "PRIVATE"
                          ? "bg-purple-950/60 text-purple-400 border border-purple-900/60"
                          : "bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      {prob.visibility}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-neutral-300">
                    <Link
                      href={`/admin/problems/${prob.id}/testcases`}
                      className="inline-flex items-center gap-1 hover:text-[#E63946] transition-colors"
                    >
                      <FileCode className="h-3.5 w-3.5 text-neutral-400" />
                      {prob._count.testCases} tests
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-neutral-400">
                    {prob._count.submissions}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/problems/${prob.slug}`} target="_blank" title="Xem trên sàn">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-white">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Link href={`/admin/problems/${prob.id}/edit`} title="Chỉnh sửa">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-white">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Link href={`/admin/problems/${prob.id}/testcases`} title="Quản lý test case">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-emerald-400">
                          <FileCode className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-xs text-neutral-500">
                  Chưa có bài tập nào hoặc không tìm thấy bài tập phù hợp.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
