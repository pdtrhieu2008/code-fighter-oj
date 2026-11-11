import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BeltBadge } from "@/components/belt/BeltBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Swords,
  Trophy,
  Users,
  Code2,
  Terminal,
  Zap,
  ArrowRight,
  Flame,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canDisplayBelt } from "@/lib/academy-access";
import { BeltColor } from "@/lib/belt-utils";

export default async function HomePage() {
  const session = await auth();

  // Fetch real statistics with fallback
  let stats = {
    fighters: 0,
    problems: 0,
    submissions: 0,
    contests: 0,
    students: 0,
  };

  let featuredProblems: any[] = [];
  let topFighters: any[] = [];

  try {
    const [fighterCount, problemCount, submissionCount, contestCount, studentCount] =
      await Promise.all([
        prisma.fighterProfile.count(),
        prisma.problem.count({ where: { visibility: "PUBLIC" } }),
        prisma.submission.count(),
        prisma.contest.count(),
        prisma.user.count({ where: { role: "STUDENT" } }),
      ]);

    stats = {
      fighters: fighterCount,
      problems: problemCount,
      submissions: submissionCount,
      contests: contestCount,
      students: studentCount,
    };

    featuredProblems = await prisma.problem.findMany({
      where: { visibility: "PUBLIC" },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    topFighters = await prisma.fighterProfile.findMany({
      take: 5,
      orderBy: { rating: "desc" },
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
    // Graceful fallback during static build / before database seed
  }

  const beltTiers: { color: BeltColor; name: string; desc: string }[] = [
    { color: "WHITE", name: "Đai Trắng", desc: "Nhập môn: Cú pháp, I/O, Biến, Điều kiện & Vòng lặp" },
    { color: "YELLOW", name: "Đai Vàng", desc: "Căn bản: Mảng, Chuỗi ký tự, Hàm & Tư duy thuật toán" },
    { color: "ORANGE", name: "Đai Cam", desc: "Tác chiến: Sắp xếp, Tìm kiếm nhị phân, Hai con trỏ" },
    { color: "GREEN", name: "Đai Xanh Lá", desc: "Trung cấp: C++ STL, Đệ quy & Quy hoạch động cơ bản" },
    { color: "BLUE", name: "Đai Xanh Dương", desc: "Thực chiến: Duyệt đồ thị BFS/DFS & DP trung cấp" },
    { color: "PURPLE", name: "Đai Tím", desc: "Cao cấp: DP nâng cao, Đường đi ngắn nhất Dijkstra, DSU" },
    { color: "BROWN", name: "Đai Nâu", desc: "Chuyên sâu: Cây đoạn Segment Tree, Fenwick Tree" },
    { color: "RED", name: "Đai Đỏ", desc: "Bậc thầy: Giải thuật phức tạp, Đồ thị nâng cao" },
    { color: "BLACK", name: "Đai Đen", desc: "Đại Sư Phụ: Đỉnh cao Lập trình Thi đấu Chuyên nghiệp" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#101114]">
      <Navbar
        user={
          session?.user
            ? {
              username: session.user.name ?? undefined,
              fighterId: session.user.email ?? undefined,
              role: "REGISTERED_USER",
              }
            : null
        }
      />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-neutral-800 bg-gradient-to-b from-[#13151A] via-[#101114] to-[#101114] py-20 sm:py-28">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

          <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-900/60 bg-red-950/40 px-3.5 py-1 text-xs font-semibold text-red-300 shadow-sm mb-6">
              <Flame className="h-3.5 w-3.5 text-[#E63946]" />
              <span className="font-mono tracking-wider">DISCIPLINE. LOGIC. VICTORY.</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white uppercase font-sans">
              TRAIN LIKE A <span className="text-[#E63946]">FIGHTER</span>.
              <br />
              CODE LIKE A <span className="bg-gradient-to-r from-red-500 via-white to-neutral-300 bg-clip-text text-transparent">CHAMPION</span>.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-neutral-400 leading-relaxed">
              Luyện rèn thuật toán, chinh phục thử thách lập trình đỉnh cao và thăng hạng qua 9 bậc đai võ thuật cùng hệ thống Online Judge chuẩn thi đấu.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/problems">
                <Button variant="fighter" size="lg" className="gap-2 h-12 px-8 text-base">
                  <Terminal className="h-5 w-5" />
                  Bắt Đầu Luyện Tập
                </Button>
              </Link>
              <Link href="/contests">
                <Button variant="outline" size="lg" className="gap-2 h-12 px-8 text-base border-neutral-700 bg-neutral-900/60">
                  <Swords className="h-5 w-5 text-[#E63946]" />
                  Khám Phá Võ Đài
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* PLATFORM STATISTICS SECTION */}
        <section className="border-b border-neutral-800 bg-[#14161C] py-10">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 text-center">
              <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                  {stats.fighters.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-neutral-400 font-medium uppercase tracking-wider">
                  Võ Sĩ Hoạt Động
                </div>
              </div>
              <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#E63946]">
                  {stats.problems.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-neutral-400 font-medium uppercase tracking-wider">
                  Thử Thách Bài Tập
                </div>
              </div>
              <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                  {stats.submissions.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-neutral-400 font-medium uppercase tracking-wider">
                  Lượt Chấm Code
                </div>
              </div>
              <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
                  {stats.contests.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-neutral-400 font-medium uppercase tracking-wider">
                  Giải Đấu Tổ Chức
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400">
                  {stats.students.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-neutral-400 font-medium uppercase tracking-wider">
                  Môn Sinh Học Viện
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9 BELT TIERS PREVIEW */}
        <section className="py-20 border-b border-neutral-800 bg-[#101114]">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col items-center text-center mb-12">
              <Badge variant="outline" className="mb-3 text-[#E63946] border-red-900/50">
                Lộ Trình Võ Thuật Lập Trình
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-white uppercase sm:text-4xl">
                Hệ Thống 9 Bậc Đai & 27 Cấp Độ
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-neutral-400">
                Từ Đai Trắng tân binh đến Đai Đen đại sư phụ. Mỗi cấp độ đòi hỏi EXP, số lượng bài tập thực chiến và các kỳ thi thăng đai chính quy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {beltTiers.map((tier) => (
                <div
                  key={tier.color}
                  className="flex items-start gap-4 rounded-xl border border-neutral-800 bg-[#16181D] p-5 transition-all hover:border-neutral-700 hover:bg-[#1B1D23]"
                >
                  <BeltBadge color={tier.color} level="LEVEL_I" size="md" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white text-sm">{tier.name}</h3>
                      <span className="text-[10px] font-mono text-neutral-500 uppercase">3 Cấp Độ</span>
                    </div>
                    <p className="mt-1.5 text-xs text-neutral-400 leading-relaxed">{tier.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED PROBLEMS */}
        <section className="py-20 border-b border-neutral-800 bg-[#121419]">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <Badge variant="outline" className="mb-2 text-[#E63946] border-red-900/50">
                  Thao Trường Luyện Tập
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase">
                  Thử Thách Nổi Bật
                </h2>
              </div>
              <Link href="/problems">
                <Button variant="ghost" className="gap-2 text-sm text-neutral-300 hover:text-white">
                  Xem Tất Cả <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {featuredProblems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {featuredProblems.map((p) => (
                  <Link
                    key={p.id}
                    href={`/problems/${p.slug}`}
                    className="group rounded-xl border border-neutral-800 bg-[#16181D] p-5 transition-all hover:border-neutral-700 hover:bg-[#1B1D23]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Badge
                        variant="secondary"
                        className={
                          p.difficulty === "BEGINNER"
                            ? "bg-neutral-800 text-neutral-300"
                            : p.difficulty === "EASY"
                            ? "bg-emerald-950 text-emerald-400 border-emerald-900/50"
                            : p.difficulty === "MEDIUM"
                            ? "bg-amber-950 text-amber-400 border-amber-900/50"
                            : "bg-red-950 text-red-400 border-red-900/50"
                        }
                      >
                        {p.difficulty}
                      </Badge>
                      <span className="text-[11px] font-mono text-neutral-500">
                        {p.timeLimit}ms
                      </span>
                    </div>

                    <h3 className="font-semibold text-white group-hover:text-[#E63946] transition-colors line-clamp-1">
                      {p.title}
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {p.tags?.slice(0, 3).map((pt: any) => (
                        <span
                          key={pt.tag.id}
                          className="rounded bg-neutral-800/80 px-2 py-0.5 text-[10px] text-neutral-400 font-mono"
                        >
                          {pt.tag.name}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-8 text-center">
                <Code2 className="mx-auto h-10 w-10 text-neutral-600 mb-3" />
                <p className="text-sm text-neutral-400">
                  Thao trường đang khởi tạo bài tập mẫu...
                </p>
                <Link href="/problems" className="mt-4 inline-block">
                  <Button variant="outline" size="sm">
                    Khám Phá Danh Sách Bài Tập
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* HALL OF FIGHTERS PREVIEW */}
        <section className="py-20 border-b border-neutral-800 bg-[#101114]">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <Badge variant="outline" className="mb-2 text-amber-400 border-amber-900/50">
                  Điện Danh Dự
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase">
                  Top Cao Thủ Võ Đài
                </h2>
              </div>
              <Link href="/leaderboard">
                <Button variant="ghost" className="gap-2 text-sm text-neutral-300 hover:text-white">
                  Bảng Phong Thần <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-[#16181D] overflow-hidden">
              <div className="divide-y divide-neutral-800/80">
                {topFighters.length > 0 ? (
                  topFighters.map((fighter, idx) => {
                    const belt = fighter.user && canDisplayBelt(fighter.user.enrollments)
                      ? fighter.user.userBelts[0]
                      : null;
                    return (
                      <div
                        key={fighter.id}
                        className="flex items-center justify-between p-4 sm:px-6 hover:bg-neutral-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-6 text-center font-mono font-bold text-neutral-500">
                            #{idx + 1}
                          </span>
                          {belt && (
                            <BeltBadge
                              color={belt.beltColor}
                              level={belt.beltLevel}
                              size="sm"
                            />
                          )}
                          <div>
                            <Link
                              href={`/fighters/${fighter.username}`}
                              className="font-semibold text-white hover:text-red-400 transition-colors"
                            >
                              {fighter.username}
                            </Link>
                            <div className="text-[11px] font-mono text-neutral-500">
                              {fighter.fighterId}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-amber-400">
                              {fighter.rating}
                            </div>
                            <div className="text-[10px] text-neutral-500 uppercase">Rating</div>
                          </div>
                          <div className="hidden sm:text-right sm:block">
                            <div className="text-xs font-mono text-neutral-300">
                              {fighter.totalSolved}
                            </div>
                            <div className="text-[10px] text-neutral-500 uppercase">Đã Giải</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-sm text-neutral-400">
                    Bảng phong thần đang ghi danh các chiến binh đầu tiên.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT & THREE PILLARS */}
        <section className="py-20 bg-[#121419]">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-white uppercase sm:text-4xl">
                Triết Lý Học Viện CODE FIGHTER
              </h2>
              <p className="mt-4 text-sm text-neutral-400 leading-relaxed">
                Học lập trình cũng như rèn luyện võ thuật: đòi hỏi kỷ luật sắt thép, tư duy sắc bén và ý chí kiên định không ngừng vượt qua giới hạn của bản thân.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-950/60 border border-red-900/50 mb-5">
                  <Terminal className="h-6 w-6 text-[#E63946]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">1. Online Judge Chuẩn Quốc Tế</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Động cơ chấm bài tự động tốc độ cao trong môi trường sandbox cô lập. Hỗ trợ đầy đủ C++17, C++20, Python 3 và Java với độ trễ cực thấp.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-950/60 border border-amber-900/50 mb-5">
                  <Shield className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">2. Hệ Thống 9 Bậc Đai Võ Sĩ</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Lộ trình học tập gamification phân tầng từ Đai Trắng đến Đai Đen. Mỗi kỳ thi thăng đai đánh giá toàn diện năng lực giải thuật và tư duy code sạch.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-950/60 border border-blue-900/50 mb-5">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">3. Học Viện & Luyện Thi THPTQG</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Quản lý lớp học chuyên sâu, bài tập nhóm, theo dõi biểu đồ tiến bộ học viên và ôn luyện chuyên biệt cho kỳ thi THPTQG Môn Tin học.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
