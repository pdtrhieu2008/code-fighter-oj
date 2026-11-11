import React from "react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BeltBadge } from "@/components/belt/BeltBadge";
import { BeltProgressBar } from "@/components/belt/BeltProgressBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Trophy,
  Flame,
  CheckCircle2,
  Terminal,
  Swords,
  BookOpen,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canDisplayBelt } from "@/lib/academy-access";
import { formatEXP, getAcceptanceRate } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const fighter = await prisma.fighterProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        include: {
          userProfile: true,
          enrollments: {
            where: {
              status: { in: ["ACTIVE", "COMPLETED"] },
              class: { courseId: { not: null } },
            },
            select: { status: true, class: { select: { courseId: true } } },
            take: 1,
          },
          userBelts: {
            orderBy: { awardedAt: "desc" },
            take: 1,
          },
          submissions: {
            take: 5,
            orderBy: { submittedAt: "desc" },
            include: { problem: true },
          },
        },
      },
    },
  });

  if (!fighter) {
    redirect("/login");
  }

  const hasCourseAccess = canDisplayBelt(fighter.user.enrollments);
  const currentBelt = hasCourseAccess ? fighter.user.userBelts[0] : null;

  const acceptanceRate = getAcceptanceRate(
    fighter.acceptedSubmissions,
    fighter.totalSubmissions
  );

  // Recommendations: 3 unsolved problems
  const recommendedProblems = await prisma.problem.findMany({
    where: { visibility: "PUBLIC" },
    take: 3,
    orderBy: { createdAt: "desc" },
    include: {
      tags: { include: { tag: true } },
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#101114]">
      <Navbar
        user={{
          username: fighter.username,
          fighterId: fighter.fighterId,
          role: (session.user as any)?.role,
        }}
      />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
        {/* Welcome & Identity Card */}
        <div className="rounded-2xl border border-neutral-800 bg-[#16181D] p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {currentBelt ? (
              <BeltBadge color={currentBelt.beltColor} level={currentBelt.beltLevel} size="lg" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-neutral-700 text-neutral-500" aria-label="Chưa có đai">
                <BookOpen className="h-8 w-8" />
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl font-bold text-white">
                  {fighter.user.userProfile?.fullName || fighter.username}
                </h1>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {fighter.fighterId}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Võ sĩ trung thành &bull; @{fighter.username}
              </p>

              <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 text-amber-400" /> Rating:{" "}
                  <strong className="text-white">{fighter.rating}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-red-400" /> EXP:{" "}
                  <strong className="text-white">{formatEXP(fighter.totalExp)}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-orange-400" /> Kỷ luật thép:{" "}
                  <strong className="text-white">{fighter.currentStreak} ngày</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href={`/fighters/${fighter.username}`}>
              <Button variant="outline" size="sm" className="text-xs">
                Xem Hồ Sơ Công Khai
              </Button>
            </Link>
            <Link href="/problems">
              <Button variant="fighter" size="sm" className="text-xs">
                Vào Luyện Tập
              </Button>
            </Link>
          </div>
        </div>

        {/* Belt Progression Bar */}
        {currentBelt ? (
          <BeltProgressBar
            currentColor={currentBelt.beltColor}
            currentLevel={currentBelt.beltLevel}
            currentExp={fighter.totalExp}
            requiredExp={1000}
          />
        ) : (
          <section className="border-y border-neutral-800 py-5">
            <h2 className="text-sm font-semibold text-white">Hệ thống đai học viện</h2>
            <p className="mt-1 text-sm text-neutral-400">Đai được cấp cho học viên có ghi danh khóa học. Lịch sử luyện tập của bạn vẫn được lưu độc lập.</p>
            <Link href="/academy" className="mt-3 inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300">Tìm hiểu khóa học <ArrowRight className="h-4 w-4" /></Link>
          </section>
        )}

        {/* Training Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-5">
            <div className="text-xs font-mono text-neutral-400 uppercase">Đã Giải (Solved)</div>
            <div className="text-3xl font-extrabold font-mono text-white mt-2">
              {fighter.totalSolved}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 font-mono">
              / {fighter.totalSubmissions} lượt nộp
            </div>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-5">
            <div className="text-xs font-mono text-neutral-400 uppercase">Tỉ Lệ AC</div>
            <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-2">
              {acceptanceRate}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 font-mono">
              Độ chính xác thuật toán
            </div>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-5">
            <div className="text-xs font-mono text-neutral-400 uppercase">Chuỗi Dài Nhất</div>
            <div className="text-3xl font-extrabold font-mono text-amber-400 mt-2">
              {fighter.longestStreak}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 font-mono">
              Ngày luyện tập liên tiếp
            </div>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-5">
            <div className="text-xs font-mono text-neutral-400 uppercase">Cấp Bậc Võ Đài</div>
            <div className="text-2xl font-bold font-mono text-[#E63946] mt-2">
              {currentBelt ? `${currentBelt.beltColor} ${currentBelt.beltLevel}` : "Chưa có đai"}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 font-mono">
              {hasCourseAccess ? "Hệ thống 27 bậc đai" : "Chỉ dành cho học viên khóa học"}
            </div>
          </div>
        </div>

        {/* Split Section: Recommended Problems & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recommended Problems */}
          <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Terminal className="h-4 w-4 text-[#E63946]" />
                Đề Xuất Luyện Rèn
              </h2>
              <Link href="/problems" className="text-xs text-neutral-400 hover:text-white">
                Tất cả &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {recommendedProblems.map((prob) => (
                <Link
                  key={prob.id}
                  href={`/problems/${prob.slug}`}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-neutral-800/80 bg-neutral-900/60 hover:bg-neutral-800/60 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-white text-xs hover:text-red-400 transition-colors">
                      {prob.title}
                    </h3>
                    <div className="flex gap-1.5 mt-1">
                      {prob.tags?.slice(0, 2).map((pt: any) => (
                        <span key={pt.tag.id} className="text-[10px] font-mono text-neutral-500">
                          #{pt.tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {prob.difficulty}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Lịch Sử Thực Chiến Gần Đây
              </h2>
            </div>

            <div className="space-y-3">
              {fighter.user.submissions.length > 0 ? (
                fighter.user.submissions.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-neutral-800/80 bg-neutral-900/40 text-xs"
                  >
                    <div>
                      <div className="font-medium text-white">{sub.problem.title}</div>
                      <div className="text-[10px] font-mono text-neutral-500">{sub.language}</div>
                    </div>
                    <Badge
                      className={
                        sub.verdict === "ACCEPTED"
                          ? "bg-emerald-950 text-emerald-400"
                          : "bg-red-950 text-red-400"
                      }
                    >
                      {sub.verdict}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-neutral-500">
                  Chưa có lần nộp bài nào. Hãy thử sức bài tập đầu tiên!
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
