import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Swords,
  Clock,
  Calendar,
  Users,
  Trophy,
  ArrowRight,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { formatDate } from "@/lib/utils";

export default async function ContestsPage() {
  const session = await auth();

  const now = new Date();

  const contests = await prisma.contest.findMany({
    orderBy: { startTime: "desc" },
    include: {
      _count: {
        select: {
          problems: true,
          participants: true,
        },
      },
      participants: session?.user?.id
        ? {
            where: { userId: session.user.id },
          }
        : false,
    },
  });

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

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
        {/* Banner Header */}
        <div className="rounded-2xl border border-neutral-800 bg-[#16181D] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-900/60 bg-red-950/40 px-3 py-0.5 text-xs font-mono text-red-300">
              <Flame className="h-3.5 w-3.5 text-[#E63946]" />
              BATTLE ARENA &bull; ĐẤU TRƯỜNG THỰC CHIẾN
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">
              Giải Đấu Lập Trình Thi Đấu (Contests)
            </h1>
            <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
              Tranh tài trực tiếp theo thể thức ICPC quốc tế. Bảng điểm đóng băng trong giờ thi đấu cuối cùng, kiểm tra toàn diện tốc độ thuật toán và bản lĩnh võ sĩ.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/leaderboard">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Trophy className="h-3.5 w-3.5 text-amber-400" /> Bảng Phong Thần
              </Button>
            </Link>
          </div>
        </div>

        {/* Contests List */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 font-mono">
            Danh Sách Các Giải Đấu ({contests.length})
          </h2>

          {contests.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {contests.map((c) => {
                const isOngoing = now >= c.startTime && now <= c.endTime;
                const isUpcoming = now < c.startTime;
                const isPast = now > c.endTime;
                const isRegistered =
                  c.participants && (c.participants as any).length > 0;

                return (
                  <div
                    key={c.id}
                    className="rounded-xl border border-neutral-800 bg-[#16181D] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-neutral-700 transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {isOngoing && (
                          <Badge className="bg-red-950 text-red-400 border border-red-800 animate-pulse font-mono text-xs">
                            ĐANG DIỄN RA
                          </Badge>
                        )}
                        {isUpcoming && (
                          <Badge className="bg-blue-950 text-blue-400 border border-blue-800 font-mono text-xs">
                            SẮP BẮT ĐẦU
                          </Badge>
                        )}
                        {isPast && (
                          <Badge variant="outline" className="text-neutral-400 font-mono text-xs">
                            ĐÃ KẾT THÚC
                          </Badge>
                        )}
                        <span className="font-mono text-xs text-neutral-500">
                          {c.scoringType}
                        </span>
                        {c.isRated && (
                          <span className="font-mono text-[11px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900/60">
                            ★ RATED
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-white hover:text-[#E63946] transition-colors">
                        <Link href={`/contests/${c.slug}`}>{c.title}</Link>
                      </h3>

                      <p className="text-xs text-neutral-400 line-clamp-2">
                        {c.description || "Thử thách lập trình thi đấu dành cho các đấu thủ Code Fighter."}
                      </p>

                      <div className="pt-2 flex flex-wrap items-center gap-5 text-xs font-mono text-neutral-400">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-neutral-500" />
                          Bắt đầu: {formatDate(c.startTime)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-neutral-500" />
                          {c._count.participants} đấu thủ
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Swords className="h-3.5 w-3.5 text-neutral-500" />
                          {c._count.problems} bài tập
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link href={`/contests/${c.slug}/scoreboard`}>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs font-mono">
                          <Trophy className="h-3.5 w-3.5 text-amber-400" /> Bảng Điểm
                        </Button>
                      </Link>
                      <Link href={`/contests/${c.slug}`}>
                        <Button
                          variant={isOngoing ? "fighter" : "secondary"}
                          size="sm"
                          className="gap-1.5 text-xs"
                        >
                          {isOngoing ? "Tham Gia Thi Đấu" : "Chi Tiết Giải"}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-12 text-center space-y-3">
              <Swords className="h-10 w-10 text-neutral-600 mx-auto" />
              <h3 className="text-sm font-semibold text-white">Chưa có giải đấu nào mở cổng</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Ban tổ chức đang chuẩn bị bộ đề thi đấu tiếp theo. Hãy đón chờ các kỳ contest sắp tới!
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
