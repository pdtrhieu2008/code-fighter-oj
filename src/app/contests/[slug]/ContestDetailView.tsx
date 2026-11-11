"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Swords, Trophy, Clock, Users, CheckCircle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface Props {
  contest: any;
  isRegistered: boolean;
  isLoggedIn: boolean;
}

export function ContestDetailView({ contest, isRegistered, isLoggedIn }: Props) {
  const router = useRouter();
  const [registered, setRegistered] = useState(isRegistered);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const start = new Date(contest.startTime);
  const end = new Date(contest.endTime);

  const hasStarted = now >= start;
  const hasEnded = now > end;

  const handleRegister = async () => {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/contests/${contest.slug}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/contests/${contest.slug}/register`, {
        method: "POST",
      });

      if (res.ok) {
        setRegistered(true);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Không thể đăng ký giải đấu.");
      }
    } catch {
      alert("Lỗi kết nối khi đăng ký.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Contest Banner */}
      <div className="rounded-2xl border border-neutral-800 bg-[#16181D] p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Badge className="bg-red-950 text-red-400 border border-red-800 font-mono text-xs">
              {hasEnded ? "ĐÃ KẾT THÚC" : hasStarted ? "ĐANG DIỄN RA" : "SẮP BẮT ĐẦU"}
            </Badge>
            <span className="font-mono text-xs text-neutral-400">
              Thể thức: <strong className="text-white">{contest.scoringType}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/contests/${contest.slug}/scoreboard`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-mono">
                <Trophy className="h-3.5 w-3.5 text-amber-400" /> Bảng Điểm Live
              </Button>
            </Link>

            {!hasEnded && (
              registered ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-900/60 text-xs font-mono text-emerald-400 font-semibold">
                  <CheckCircle className="h-3.5 w-3.5" /> Đã Đăng Ký
                </div>
              ) : (
                <Button
                  variant="fighter"
                  size="sm"
                  onClick={handleRegister}
                  disabled={loading}
                  className="gap-1.5 text-xs"
                >
                  {loading ? "Đang Xử Lý..." : "Đăng Ký Tham Gia"}
                </Button>
              )
            )}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          {contest.title}
        </h1>

        <p className="text-xs text-neutral-300 leading-relaxed max-w-3xl whitespace-pre-line">
          {contest.description || "Quy tụ các đấu thủ giải thuật hàng đầu tranh tài theo thể thức chấm bài trực tiếp."}
        </p>

        <div className="pt-4 border-t border-neutral-800/80 flex flex-wrap gap-6 text-xs font-mono text-neutral-400">
          <div>
            <span className="text-neutral-500">Bắt đầu: </span>
            <strong className="text-white">{formatDate(contest.startTime)}</strong>
          </div>
          <div>
            <span className="text-neutral-500">Kết thúc: </span>
            <strong className="text-white">{formatDate(contest.endTime)}</strong>
          </div>
          <div>
            <span className="text-neutral-500">Số lượng đấu thủ: </span>
            <strong className="text-white">{contest._count.participants}</strong>
          </div>
        </div>
      </div>

      {/* Problem Set */}
      <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <Swords className="h-4 w-4 text-[#E63946]" />
          Bộ Đề Thi Đấu ({contest.problems.length} bài)
        </h2>

        {!hasStarted ? (
          <div className="py-12 text-center space-y-3">
            <Clock className="h-8 w-8 text-amber-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">Bộ đề chưa mở cổng</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Theo quy chuẩn an ninh, các bài tập trong đề thi sẽ tự động hiển thị chính xác vào thời điểm giải đấu chính thức bắt đầu.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {contest.problems.map((cp: any) => (
              <div
                key={cp.id}
                className="py-4 flex items-center justify-between hover:bg-neutral-800/30 px-3 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="h-8 w-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center font-mono font-bold text-sm text-[#E63946]">
                    {cp.problemLabel}
                  </span>
                  <div>
                    <Link
                      href={`/problems/${cp.problem.slug}`}
                      className="font-semibold text-white text-sm hover:text-[#E63946] transition-colors"
                    >
                      {cp.problem.title}
                    </Link>
                    <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
                      Giới hạn: {cp.problem.timeLimit}ms &bull; {Math.round(cp.problem.memoryLimit / 1024)}MB
                    </div>
                  </div>
                </div>

                <Link href={`/problems/${cp.problem.slug}`}>
                  <Button variant="outline" size="sm" className="text-xs font-mono">
                    Giải Bài
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
