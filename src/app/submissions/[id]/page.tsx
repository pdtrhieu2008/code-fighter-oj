import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BeltBadge } from "@/components/belt/BeltBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Cpu, FileCode2, ArrowLeft, ShieldAlert, Terminal } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { formatDate } from "@/lib/utils";
import { canDisplayBelt } from "@/lib/academy-access";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SubmissionDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      problem: true,
      user: {
        include: {
          fighterProfile: true,
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
  });

  if (!submission) {
    notFound();
  }

  const isOwner = session?.user?.id === submission.userId;
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes((session?.user as any)?.role);
  const canViewCode = isOwner || isAdmin || submission.isPublic;

  const fp = submission.user.fighterProfile;
  const belt = canDisplayBelt(submission.user.enrollments) ? submission.user.userBelts[0] : null;

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

      <main className="flex-1 container mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
        {/* Top Back Nav */}
        <div className="flex items-center justify-between">
          <Link href="/submissions">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-neutral-400">
              <ArrowLeft className="h-3.5 w-3.5" /> Quay Lại Danh Sách
            </Button>
          </Link>
          <span className="font-mono text-xs text-neutral-500">
            Mã lượt nộp: {submission.id}
          </span>
        </div>

        {/* Verdict Banner */}
        <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-neutral-400 mb-1">
                Bài toán:{" "}
                <Link
                  href={`/problems/${submission.problem.slug}`}
                  className="text-white font-semibold hover:text-[#E63946] underline"
                >
                  {submission.problem.title}
                </Link>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-mono text-neutral-400">Phán Quyết:</span>
                <span
                  className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                    submission.verdict === "ACCEPTED"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : submission.verdict === "WRONG_ANSWER"
                      ? "bg-red-950 text-red-400 border border-red-800"
                      : "bg-amber-950 text-amber-400 border border-amber-800"
                  }`}
                >
                  {submission.verdict}
                </span>
                <span className="text-xs font-mono text-white">({submission.score} pts)</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-300">
              <span className="flex items-center gap-1.5 bg-neutral-900 px-3 py-1.5 rounded border border-neutral-800">
                <Clock className="h-3.5 w-3.5 text-neutral-500" />
                {submission.executionTime !== null ? `${submission.executionTime} ms` : "-"}
              </span>
              <span className="flex items-center gap-1.5 bg-neutral-900 px-3 py-1.5 rounded border border-neutral-800">
                <Cpu className="h-3.5 w-3.5 text-neutral-500" />
                {submission.memoryUsed !== null ? `${submission.memoryUsed} KB` : "-"}
              </span>
              <span className="bg-neutral-900 px-3 py-1.5 rounded border border-neutral-800 text-neutral-400">
                {submission.language}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <span>Võ sĩ:</span>
              {belt && <BeltBadge color={belt.beltColor} level={belt.beltLevel} size="sm" />}
              <span className="text-white font-medium">
                {fp?.username || submission.user.email}
              </span>
            </div>
            <div>Thời điểm nộp: {formatDate(submission.submittedAt)}</div>
          </div>
        </div>

        {/* Compiler Output if any */}
        {submission.compilerOutput && (
          <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-5 space-y-2">
            <h3 className="text-xs font-semibold text-amber-400 font-mono">
              Thông Điệp Trình Biên Dịch (Compiler Output)
            </h3>
            <pre className="p-3 rounded bg-neutral-950 font-mono text-xs text-neutral-300 overflow-x-auto">
              {submission.compilerOutput}
            </pre>
          </div>
        )}

        {/* Source Code Box */}
        <div className="rounded-xl border border-neutral-800 bg-[#16181D] overflow-hidden">
          <div className="px-5 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs font-mono text-neutral-400">
            <span className="flex items-center gap-2 text-white font-medium">
              <Terminal className="h-4 w-4 text-[#E63946]" />
              Mã Nguồn Đã Nộp
            </span>
            <span>{submission.language}</span>
          </div>

          {canViewCode ? (
            <pre className="p-5 font-mono text-xs text-neutral-200 bg-[#0E0F12] overflow-x-auto leading-relaxed">
              <code>{submission.sourceCode}</code>
            </pre>
          ) : (
            <div className="p-10 text-center space-y-2">
              <ShieldAlert className="h-8 w-8 text-neutral-600 mx-auto" />
              <p className="text-xs text-neutral-400">
                Mã nguồn của bài nộp này được đặt ở chế độ riêng tư theo thiết lập của tác giả.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
