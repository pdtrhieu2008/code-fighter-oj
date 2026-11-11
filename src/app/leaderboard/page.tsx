import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BeltBadge } from "@/components/belt/BeltBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy, Medal, Shield, Swords } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { formatEXP } from "@/lib/utils";
import { canDisplayBelt } from "@/lib/academy-access";

interface Props {
  searchParams: Promise<{
    sort?: string;
  }>;
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const session = await auth();
  const params = await searchParams;
  const sort = params.sort || "rating";

  let orderBy: any = { rating: "desc" };
  if (sort === "solved") orderBy = { totalSolved: "desc" };
  if (sort === "exp") orderBy = { totalExp: "desc" };

  let fighters: any[] = [];
  try {
    fighters = await prisma.fighterProfile.findMany({
      take: 50,
      orderBy,
      include: {
        user: {
          include: {
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
          },
        },
      },
    });
  } catch (e) {
    // fallback
  }

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-400" />
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase font-sans">
                Bảng Phong Thần Võ Đài
              </h1>
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              Vinh danh các võ sĩ lập trình xuất sắc nhất của Code Fighter OJ.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/leaderboard?sort=rating">
              <Button
                variant={sort === "rating" ? "secondary" : "ghost"}
                size="sm"
                className="text-xs font-mono"
              >
                Rating
              </Button>
            </Link>
            <Link href="/leaderboard?sort=solved">
              <Button
                variant={sort === "solved" ? "secondary" : "ghost"}
                size="sm"
                className="text-xs font-mono"
              >
                Bài Đã Giải
              </Button>
            </Link>
            <Link href="/leaderboard?sort=exp">
              <Button
                variant={sort === "exp" ? "secondary" : "ghost"}
                size="sm"
                className="text-xs font-mono"
              >
                EXP Tích Lũy
              </Button>
            </Link>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="rounded-xl border border-neutral-800 bg-[#16181D] overflow-hidden">
          <Table>
            <TableHeader className="bg-neutral-900/60">
              <TableRow className="border-neutral-800">
                <TableHead className="w-16 text-center font-mono">Hạng</TableHead>
                <TableHead className="w-16">Đai</TableHead>
                <TableHead>Võ Sĩ (Fighter)</TableHead>
                <TableHead className="w-28 text-right">Rating</TableHead>
                <TableHead className="w-28 text-right hidden sm:table-cell">Bài Giải</TableHead>
                <TableHead className="w-28 text-right">Tổng EXP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fighters.length > 0 ? (
                fighters.map((f, idx) => {
                  const belt = f.user && canDisplayBelt(f.user.enrollments)
                    ? f.user.userBelts[0]
                    : null;
                  const isTop3 = idx < 3;
                  return (
                    <TableRow key={f.id} className="border-neutral-800 hover:bg-neutral-800/40">
                      <TableCell className="text-center font-mono font-bold text-xs">
                        {idx === 0 ? (
                          <span className="text-amber-400 text-sm">🥇 1</span>
                        ) : idx === 1 ? (
                          <span className="text-neutral-300 text-sm">🥈 2</span>
                        ) : idx === 2 ? (
                          <span className="text-amber-700 text-sm">🥉 3</span>
                        ) : (
                          <span className="text-neutral-500">#{idx + 1}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {belt && (
                          <BeltBadge
                            color={belt.beltColor}
                            level={belt.beltLevel}
                            size="sm"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/fighters/${f.username}`}
                          className="font-medium text-white hover:text-red-400 transition-colors"
                        >
                          {f.username}
                        </Link>
                        <div className="font-mono text-[11px] text-neutral-500">
                          {f.fighterId}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-amber-400">
                        {f.rating}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-neutral-300 hidden sm:table-cell">
                        {f.totalSolved}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-neutral-400">
                        {formatEXP(f.totalExp)}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-xs text-neutral-500">
                    Chưa có dữ liệu bảng phong thần.
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
