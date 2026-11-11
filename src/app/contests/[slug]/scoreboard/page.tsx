import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy, ArrowLeft, Clock, RefreshCw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { calculateICPCStandings } from "@/lib/icpc-scoreboard";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ContestScoreboardPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();

  const contest = await prisma.contest.findUnique({
    where: { slug },
    include: {
      contestProblems: {
        orderBy: { orderIndex: "asc" },
        include: {
          problem: { select: { id: true, title: true, slug: true } },
        },
      },
      contestParticipants: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fighterProfile: {
                select: { username: true, fighterId: true, rating: true },
              },
            },
          },
        },
      },
    },
  });

  if (!contest) {
    notFound();
  }

  const problemIds = contest.contestProblems.map((cp) => cp.problemId);

  const submissions = await prisma.submission.findMany({
    where: {
      problemId: { in: problemIds },
      submittedAt: {
        gte: contest.startTime,
        lte: contest.endTime,
      },
    },
    select: {
      userId: true,
      problemId: true,
      verdict: true,
      submittedAt: true,
    },
  });

  const problems = contest.contestProblems.map((cp) => ({
    id: cp.problemId,
    problemLabel: cp.problemLabel,
    title: cp.problem.title,
    slug: cp.problem.slug,
  }));

  const participants = contest.contestParticipants.map((cp) => ({
    userId: cp.userId,
    username: cp.user.fighterProfile?.username || cp.user.email.split("@")[0],
    fighterId: cp.user.fighterProfile?.fighterId || "CF-000000",
    rating: cp.user.fighterProfile?.rating || 1200,
  }));

  const standings = calculateICPCStandings(
    contest.startTime,
    problems,
    participants,
    submissions
  );

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

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link href={`/contests/${contest.slug}`}>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-neutral-400 mb-2">
                <ArrowLeft className="h-3.5 w-3.5" /> Về Chi Tiết Giải Đấu
              </Button>
            </Link>
            <div className="flex items-center gap-2.5">
              <Trophy className="h-6 w-6 text-amber-400" />
              <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
                Bảng Điểm Trực Tiếp (Live ICPC Scoreboard)
              </h1>
            </div>
            <p className="text-xs text-neutral-400 mt-1 font-mono">
              Giải: <span className="text-white font-bold">{contest.title}</span> &bull; Thể thức ICPC (Penalty 20 phút / lần sai)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono text-emerald-400 border-emerald-900/60">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
              LIVE
            </Badge>
          </div>
        </div>

        {/* Scoreboard Table */}
        <div className="rounded-xl border border-neutral-800 bg-[#16181D] overflow-x-auto">
          <Table>
            <TableHeader className="bg-neutral-900/80">
              <TableRow className="border-neutral-800">
                <TableHead className="w-16 font-mono text-center">Hạng</TableHead>
                <TableHead className="min-w-[180px]">Võ Sĩ (Fighter)</TableHead>
                <TableHead className="w-20 text-center font-mono">Đã Giải</TableHead>
                <TableHead className="w-24 text-right font-mono">Penalty</TableHead>

                {problems.map((p) => (
                  <TableHead key={p.id} className="w-20 text-center font-mono">
                    <span className="text-[#E63946] font-bold">{p.problemLabel}</span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.length > 0 ? (
                standings.map((st) => (
                  <TableRow key={st.userId} className="border-neutral-800 hover:bg-neutral-800/40">
                    <TableCell className="text-center font-mono font-bold text-xs">
                      {st.rank === 1 ? (
                        <span className="text-amber-400">🥇 1</span>
                      ) : st.rank === 2 ? (
                        <span className="text-neutral-300">🥈 2</span>
                      ) : st.rank === 3 ? (
                        <span className="text-amber-600">🥉 3</span>
                      ) : (
                        <span className="text-neutral-500">#{st.rank}</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Link
                        href={`/fighters/${st.username}`}
                        className="font-medium text-white text-xs hover:text-[#E63946] transition-colors block"
                      >
                        {st.username}
                      </Link>
                      <div className="font-mono text-[10px] text-neutral-500">
                        {st.fighterId}
                      </div>
                    </TableCell>

                    <TableCell className="text-center font-mono text-sm font-bold text-emerald-400">
                      {st.totalSolved}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs text-neutral-300 font-semibold">
                      {st.totalPenalty}
                    </TableCell>

                    {problems.map((prob) => {
                      const res = st.problemResults[prob.id];
                      if (!res) {
                        return <TableCell key={prob.id} className="text-center font-mono text-xs text-neutral-700">-</TableCell>;
                      }

                      if (res.solved) {
                        return (
                          <TableCell key={prob.id} className="text-center p-2">
                            <div className="rounded bg-emerald-950/70 border border-emerald-900/60 p-1 text-center font-mono">
                              <div className="text-xs font-bold text-emerald-400">
                                +{res.wrongAttempts > 0 ? res.wrongAttempts : ""}
                              </div>
                              <div className="text-[10px] text-emerald-500">
                                {res.acceptedAtMinute}&apos;
                              </div>
                            </div>
                          </TableCell>
                        );
                      }

                      if (res.wrongAttempts > 0) {
                        return (
                          <TableCell key={prob.id} className="text-center p-2">
                            <div className="rounded bg-red-950/40 border border-red-900/40 p-1 text-center font-mono">
                              <div className="text-xs font-bold text-red-400">
                                -{res.wrongAttempts}
                              </div>
                            </div>
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell key={prob.id} className="text-center font-mono text-xs text-neutral-700">
                          -
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4 + problems.length}
                    className="text-center py-10 text-xs text-neutral-500"
                  >
                    Chưa có đấu thủ nào tham gia hoặc nộp bài trong giải đấu này.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <Footer />
    </div>
  );
}
