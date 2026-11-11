import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BeltBadge } from "@/components/belt/BeltBadge";
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
import { Clock, Cpu, FileCode2, History } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { formatDate } from "@/lib/utils";
import { canDisplayBelt } from "@/lib/academy-access";
import { Verdict, Language } from "@prisma/client";

interface Props {
  searchParams: Promise<{
    verdict?: string;
    language?: string;
    page?: string;
  }>;
}

export default async function SubmissionsPage({ searchParams }: Props) {
  const session = await auth();
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (params.verdict && Object.values(Verdict).includes(params.verdict as Verdict)) {
    where.verdict = params.verdict;
  }
  if (params.language && Object.values(Language).includes(params.language as Language)) {
    where.language = params.language;
  }

  const [total, submissions] = await Promise.all([
    prisma.submission.count({ where }),
    prisma.submission.findMany({
      where,
      skip,
      take: limit,
      orderBy: { submittedAt: "desc" },
      include: {
        problem: { select: { title: true, slug: true } },
        user: {
          select: {
            id: true,
            email: true,
            fighterProfile: { select: { username: true, fighterId: true } },
            enrollments: {
              where: {
                status: { in: ["ACTIVE", "COMPLETED"] },
                class: { courseId: { not: null } },
              },
              select: { status: true, class: { select: { courseId: true } } },
              take: 1,
            },
            userBelts: { orderBy: { awardedAt: "desc" }, take: 1 },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  const getVerdictBadge = (verdict: Verdict) => {
    switch (verdict) {
      case "ACCEPTED":
        return <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-900 font-mono text-[11px]">ACCEPTED</Badge>;
      case "WRONG_ANSWER":
        return <Badge className="bg-red-950 text-red-400 border border-red-900 font-mono text-[11px]">WRONG ANSWER</Badge>;
      case "TIME_LIMIT_EXCEEDED":
        return <Badge className="bg-amber-950 text-amber-400 border border-amber-900 font-mono text-[11px]">TIME LIMIT</Badge>;
      case "COMPILATION_ERROR":
        return <Badge className="bg-yellow-950 text-yellow-400 border border-yellow-900 font-mono text-[11px]">COMPILE ERROR</Badge>;
      default:
        return <Badge variant="secondary" className="font-mono text-[11px]">{verdict}</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#101114]">
      <Navbar
        user={
          session?.user
            ? {
                username: (session.user as any).username,
                fighterId: (session.user as any).fighterId,
                role: (session.user as any).role,
              }
            : null
        }
      />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <History className="h-6 w-6 text-[#E63946]" />
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase font-sans">
                Lịch Sử Chấm Bài Toàn Sàn
              </h1>
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              Nhật ký thực thi mã nguồn thời gian thực từ các đấu thủ trên võ đài.
            </p>
          </div>

          <div className="text-xs font-mono text-neutral-400">
            Tổng cộng: <strong className="text-white">{total}</strong> lượt nộp
          </div>
        </div>

        {/* Submissions Table */}
        <div className="rounded-xl border border-neutral-800 bg-[#16181D] overflow-hidden">
          <Table>
            <TableHeader className="bg-neutral-900/60">
              <TableRow className="border-neutral-800">
                <TableHead className="w-20 font-mono text-center">ID</TableHead>
                <TableHead>Võ Sĩ (Fighter)</TableHead>
                <TableHead>Bài Tập</TableHead>
                <TableHead className="w-36">Phán Quyết</TableHead>
                <TableHead className="w-24">Ngôn Ngữ</TableHead>
                <TableHead className="w-24 text-right">Thời Gian</TableHead>
                <TableHead className="w-24 text-right hidden sm:table-cell">Bộ Nhớ</TableHead>
                <TableHead className="w-32 text-right">Thời Điểm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.length > 0 ? (
                submissions.map((sub) => {
                  const fp = sub.user.fighterProfile;
                  const belt = canDisplayBelt(sub.user.enrollments) ? sub.user.userBelts[0] : null;
                  return (
                    <TableRow key={sub.id} className="border-neutral-800 hover:bg-neutral-800/40">
                      <TableCell className="font-mono text-xs text-center text-neutral-500">
                        <Link href={`/submissions/${sub.id}`} className="hover:text-white underline">
                          #{sub.id.slice(-6)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {belt && (
                            <BeltBadge color={belt.beltColor} level={belt.beltLevel} size="sm" />
                          )}
                          <Link
                            href={fp ? `/fighters/${fp.username}` : "#"}
                            className="font-medium text-white text-xs hover:text-[#E63946] transition-colors"
                          >
                            {fp?.username || sub.user.email.split("@")[0]}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/problems/${sub.problem.slug}`}
                          className="font-medium text-neutral-200 text-xs hover:text-[#E63946] transition-colors"
                        >
                          {sub.problem.title}
                        </Link>
                      </TableCell>
                      <TableCell>{getVerdictBadge(sub.verdict)}</TableCell>
                      <TableCell className="font-mono text-xs text-neutral-400">
                        {sub.language}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-neutral-300">
                        {sub.executionTime !== null ? `${sub.executionTime} ms` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-neutral-400 hidden sm:table-cell">
                        {sub.memoryUsed !== null ? `${sub.memoryUsed} KB` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-neutral-500">
                        {formatDate(sub.submittedAt)}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-xs text-neutral-500">
                    Chưa có lượt nộp bài nào trên hệ thống.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => {
              const pNum = i + 1;
              return (
                <Link key={pNum} href={`/submissions?page=${pNum}`}>
                  <Button
                    variant={page === pNum ? "fighter" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0 text-xs font-mono"
                  >
                    {pNum}
                  </Button>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
