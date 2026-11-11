import React from "react";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BeltBadge } from "@/components/belt/BeltBadge";
import { BeltProgressBar } from "@/components/belt/BeltProgressBar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Trophy,
  Flame,
  CheckCircle,
  Clock,
  Calendar,
  Award,
  BookOpen,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { formatEXP, formatDate, getAcceptanceRate } from "@/lib/utils";
import { canDisplayBelt } from "@/lib/academy-access";
import Link from "next/link";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function FighterProfilePage({ params }: Props) {
  const { username } = await params;
  const session = await auth();

  const fighter = await prisma.fighterProfile.findUnique({
    where: { username: username.toLowerCase() },
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
            take: 10,
            orderBy: { submittedAt: "desc" },
            include: { problem: true },
          },
          userAchievements: {
            include: { achievement: true },
          },
        },
      },
    },
  });

  if (!fighter) {
    notFound();
  }

  const hasCourseAccess = canDisplayBelt(fighter.user.enrollments);
  const currentBelt = hasCourseAccess ? fighter.user.userBelts[0] : null;

  const acceptanceRate = getAcceptanceRate(
    fighter.acceptedSubmissions,
    fighter.totalSubmissions
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

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Fighter Hero Banner */}
        <div className="relative rounded-2xl border border-neutral-800 bg-[#16181D] p-6 sm:p-8 mb-8 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            {/* Belt Badge (Large) */}
            {currentBelt ? (
              <BeltBadge color={currentBelt.beltColor} level={currentBelt.beltLevel} size="lg" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-neutral-700 text-neutral-500" aria-label="Chưa có đai">
                <BookOpen className="h-8 w-8" />
              </div>
            )}

            {/* Fighter Info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {fighter.user.userProfile?.fullName || fighter.username}
                </h1>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {fighter.fighterId}
                </span>
                <span className="font-mono text-xs text-neutral-500">
                  @{fighter.username}
                </span>
              </div>

              {fighter.user.userProfile?.bio && (
                <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
                  {fighter.user.userProfile.bio}
                </p>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-mono text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 text-amber-400" /> Rating:{" "}
                  <strong className="text-white">{fighter.rating}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-red-400" /> EXP:{" "}
                  <strong className="text-white">{formatEXP(fighter.totalExp)}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-orange-400" /> Chuỗi Thép:{" "}
                  <strong className="text-white">{fighter.currentStreak} ngày</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 6 PROFILE TABS */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-neutral-900 border border-neutral-800 p-1">
            <TabsTrigger value="overview" className="text-xs font-mono">
              Tổng Quan
            </TabsTrigger>
            <TabsTrigger value="submissions" className="text-xs font-mono">
              Lịch Sử Nộp Bài
            </TabsTrigger>
            <TabsTrigger value="achievements" className="text-xs font-mono">
              Danh Hiệu
            </TabsTrigger>
            <TabsTrigger value="belt-journey" className="text-xs font-mono">
              Hành Trình Đai
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-4 text-center">
                <div className="text-2xl font-bold font-mono text-white">
                  {fighter.totalSolved}
                </div>
                <div className="text-[11px] font-mono text-neutral-500 uppercase mt-1">
                  Bài Đã Giải
                </div>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-4 text-center">
                <div className="text-2xl font-bold font-mono text-white">
                  {acceptanceRate}
                </div>
                <div className="text-[11px] font-mono text-neutral-500 uppercase mt-1">
                  Tỉ Lệ Chấp Thuận
                </div>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-4 text-center">
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {fighter.acceptedSubmissions}
                </div>
                <div className="text-[11px] font-mono text-neutral-500 uppercase mt-1">
                  Accepted (AC)
                </div>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-4 text-center">
                <div className="text-2xl font-bold font-mono text-white">
                  {fighter.totalSubmissions}
                </div>
                <div className="text-[11px] font-mono text-neutral-500 uppercase mt-1">
                  Tổng Lượt Nộp
                </div>
              </div>
            </div>

            {/* Recent Submissions */}
            <div className="rounded-xl border border-neutral-800 bg-[#16181D] overflow-hidden">
              <div className="bg-neutral-900/80 px-4 py-3 border-b border-neutral-800 font-semibold text-xs text-white">
                Hoạt Động Nộp Bài Gần Đây
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-neutral-800">
                    <TableHead>Bài Tập</TableHead>
                    <TableHead>Phán Quyết</TableHead>
                    <TableHead>Ngôn Ngữ</TableHead>
                    <TableHead className="text-right">Thời Gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fighter.user.submissions.length > 0 ? (
                    fighter.user.submissions.map((sub: any) => (
                      <TableRow key={sub.id} className="border-neutral-800">
                        <TableCell>
                          <Link
                            href={`/problems/${sub.problem.slug}`}
                            className="font-medium text-white hover:text-red-400"
                          >
                            {sub.problem.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              sub.verdict === "ACCEPTED"
                                ? "bg-emerald-950 text-emerald-400"
                                : "bg-red-950 text-red-400"
                            }
                          >
                            {sub.verdict}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-neutral-400">
                          {sub.language}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-neutral-500">
                          {formatDate(sub.submittedAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-xs text-neutral-500">
                        Chưa có lượt nộp bài nào.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* TAB 2: SUBMISSIONS */}
          <TabsContent value="submissions">
            <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-6 text-sm text-neutral-400">
              Lịch sử {fighter.user.submissions.length} lần nộp bài gần nhất đã được lưu trong cơ sở dữ liệu.
            </div>
          </TabsContent>

          {/* TAB 3: ACHIEVEMENTS */}
          <TabsContent value="achievements">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {fighter.user.userAchievements.length > 0 ? (
                fighter.user.userAchievements.map((ua: any) => (
                  <div
                    key={ua.id}
                    className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-[#16181D] p-4"
                  >
                    <Award className="h-8 w-8 text-amber-400" />
                    <div>
                      <h4 className="font-semibold text-white text-xs">{ua.achievement.name}</h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">{ua.achievement.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-10 rounded-xl border border-neutral-800 bg-[#16181D] text-xs text-neutral-500">
                  Võ sĩ chưa mở khóa danh hiệu nào. Hãy giải bài và tham gia đấu trường!
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 4: BELT JOURNEY */}
          <TabsContent value="belt-journey" className="space-y-4">
              {hasCourseAccess ? (
                <>
                  {currentBelt ? (
                    <BeltProgressBar
                      currentColor={currentBelt.beltColor}
                      currentLevel={currentBelt.beltLevel}
                      currentExp={fighter.totalExp}
                      requiredExp={1000}
                    />
                  ) : (
                    <p className="text-sm text-neutral-400">Bạn đã ghi danh khóa học. Đai sẽ xuất hiện sau khi được cấp bởi học viện.</p>
                  )}
                  <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-6 text-xs text-neutral-400 leading-relaxed">
                    Hành trình đai học viện dựa trên kết quả khóa học và các kỳ thi tương ứng. EXP luyện tập không tự cấp đai.
                  </div>
                </>
              ) : (
                <div className="border-y border-neutral-800 py-6 text-sm text-neutral-400">
                  Hành trình đai dành riêng cho học viên đã ghi danh khóa học. Hồ sơ luyện tập và submission vẫn công khai theo cài đặt tài khoản.
                </div>
              )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
