import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { BeltBadge } from "@/components/belt/BeltBadge";
import { StudentAdminPanel } from "./StudentAdminPanel";
import { ArrowLeft, BookOpen, CheckCircle2, Clock3, GraduationCap, Mail, Shield, Trophy, UserRound } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      userProfile: { select: { fullName: true, bio: true, location: true, website: true, githubHandle: true, twitterHandle: true } },
      fighterProfile: { select: { username: true, fighterId: true, totalExp: true, rating: true, totalSolved: true, totalSubmissions: true, acceptedSubmissions: true, currentStreak: true, longestStreak: true } },
      userBelts: { orderBy: { awardedAt: "desc" }, take: 12, select: { id: true, beltColor: true, beltLevel: true, awardedAt: true, notes: true } },
      enrollments: { orderBy: { enrolledAt: "desc" }, take: 20, select: { id: true, status: true, enrolledAt: true, completedAt: true, class: { select: { name: true, startDate: true, endDate: true, course: { select: { title: true, slug: true } } } } } },
      submissions: { orderBy: { submittedAt: "desc" }, take: 15, select: { id: true, verdict: true, score: true, language: true, submittedAt: true, judgedAt: true, problem: { select: { title: true, slug: true } } } },
      _count: { select: { submissions: true, enrollments: true, contestParticipations: true } },
    },
  });

  if (!user) notFound();
  const fighter = user.fighterProfile;
  const profile = user.userProfile;
  const currentBelt = user.userBelts[0] ?? null;
  const displayName = profile?.fullName || fighter?.username || user.email;
  const acceptanceRate = fighter && fighter.totalSubmissions > 0 ? Math.round((fighter.acceptedSubmissions / fighter.totalSubmissions) * 100) : 0;
  const metrics: { label: string; value: string | number; Icon: typeof Trophy }[] = [
    { label: "EXP", value: fighter?.totalExp ?? 0, Icon: Trophy },
    { label: "Rating", value: fighter?.rating ?? 1200, Icon: Trophy },
    { label: "Bài đã giải", value: fighter?.totalSolved ?? 0, Icon: CheckCircle2 },
    { label: "Tỷ lệ AC", value: `${acceptanceRate}%`, Icon: CheckCircle2 },
  ];

  return <div className="space-y-6">
    <Link href="/admin/users" className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white"><ArrowLeft className="h-4 w-4"/>Quay lại danh sách học viên</Link>
    <header className="flex flex-col justify-between gap-4 border-b border-neutral-800 pb-5 md:flex-row md:items-end">
      <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full border border-red-900 bg-red-950/40 text-red-300"><UserRound className="h-7 w-7"/></div><div><h1 className="text-2xl font-bold text-white">{displayName}</h1><p className="mt-1 font-mono text-xs text-neutral-500">{fighter ? `@${fighter.username} · ${fighter.fighterId}` : "Chưa lập Fighter Profile"}</p></div></div>
      <div className="flex items-center gap-2 text-xs font-mono text-neutral-400"><Shield className="h-4 w-4 text-amber-400"/>{user.role}<span className="text-neutral-700">|</span><Mail className="h-4 w-4"/>{user.email}</div>
    </header>

    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map(({ label, value, Icon }) => <div key={label} className="border border-neutral-800 bg-[#16181D] p-4"><div className="flex items-center justify-between text-xs text-neutral-500"><span>{label}</span><Icon className="h-4 w-4 text-amber-400"/></div><div className="mt-2 text-2xl font-bold text-white">{value}</div></div>)}
    </section>

    <StudentAdminPanel
      userId={user.id}
      initialProfile={{
        fullName: profile?.fullName ?? "",
        bio: profile?.bio ?? "",
        location: profile?.location ?? "",
        website: profile?.website ?? "",
        githubHandle: profile?.githubHandle ?? "",
        twitterHandle: profile?.twitterHandle ?? "",
      }}
      currentBelt={
        currentBelt
          ? {
              beltColor: currentBelt.beltColor,
              beltLevel: currentBelt.beltLevel,
              awardedAt: currentBelt.awardedAt.toISOString(),
            }
          : null
      }
    />

    <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
      <section className="border border-neutral-800 bg-[#16181D] p-5"><h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><GraduationCap className="h-4 w-4 text-emerald-400"/>Lớp học & enrollment ({user._count.enrollments})</h2><div className="space-y-2">{user.enrollments.length ? user.enrollments.map((enrollment) => <div key={enrollment.id} className="border border-neutral-800 bg-neutral-900/50 p-3"><div className="flex items-center justify-between gap-3"><div><div className="text-sm font-medium text-white">{enrollment.class.course?.title || "Lớp độc lập"}</div><div className="text-xs text-neutral-400">{enrollment.class.name}</div></div><span className={`border px-2 py-1 text-[10px] font-mono ${enrollment.status === "ACTIVE" ? "border-emerald-900 text-emerald-300" : enrollment.status === "COMPLETED" ? "border-blue-900 text-blue-300" : "border-red-900 text-red-300"}`}>{enrollment.status}</span></div><div className="mt-2 text-[11px] text-neutral-500">Ghi danh: {formatDate(enrollment.enrolledAt)}{enrollment.completedAt ? ` · Hoàn thành: ${formatDate(enrollment.completedAt)}` : ""}</div></div>) : <p className="text-sm text-neutral-500">Chưa ghi danh lớp nào.</p>}</div></section>
      <section className="border border-neutral-800 bg-[#16181D] p-5"><h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><BookOpen className="h-4 w-4 text-red-400"/>Hoạt động bài tập</h2><div className="grid grid-cols-2 gap-3 text-xs"><div className="border border-neutral-800 p-3"><span className="text-neutral-500">Tổng submissions</span><strong className="mt-1 block text-lg text-white">{fighter?.totalSubmissions ?? user._count.submissions}</strong></div><div className="border border-neutral-800 p-3"><span className="text-neutral-500">Accepted</span><strong className="mt-1 block text-lg text-emerald-300">{fighter?.acceptedSubmissions ?? 0}</strong></div><div className="border border-neutral-800 p-3"><span className="text-neutral-500">Streak hiện tại</span><strong className="mt-1 block text-lg text-white">{fighter?.currentStreak ?? 0}</strong></div><div className="border border-neutral-800 p-3"><span className="text-neutral-500">Streak dài nhất</span><strong className="mt-1 block text-lg text-white">{fighter?.longestStreak ?? 0}</strong></div></div><p className="mt-4 text-xs text-neutral-500">Tham gia {user._count.contestParticipations} contest · Tài khoản tạo {formatDate(user.createdAt)}</p></section>
    </div>

    <section className="border border-neutral-800 bg-[#16181D] p-5"><h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><Trophy className="h-4 w-4 text-amber-400"/>Lịch sử đai ({user.userBelts.length})</h2><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-neutral-500"><tr><th className="p-2">Đai</th><th className="p-2">Ngày cấp</th><th className="p-2">Ghi chú</th></tr></thead><tbody>{user.userBelts.map((belt) => <tr key={belt.id} className="border-t border-neutral-800 text-neutral-300"><td className="p-2"><BeltBadge color={belt.beltColor} level={belt.beltLevel} size="sm"/></td><td className="p-2 font-mono text-neutral-400">{formatDate(belt.awardedAt)}</td><td className="p-2 text-neutral-400">{belt.notes || "—"}</td></tr>)}{user.userBelts.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-neutral-500">Học viên chưa được cấp đai.</td></tr>}</tbody></table></div></section>

    <section className="border border-neutral-800 bg-[#16181D] p-5"><h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><Clock3 className="h-4 w-4 text-amber-400"/>Submissions gần đây</h2><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-neutral-500"><tr><th className="p-2">Bài</th><th className="p-2">Verdict</th><th className="p-2">Score</th><th className="p-2">Ngôn ngữ</th><th className="p-2">Thời gian</th></tr></thead><tbody>{user.submissions.map((submission) => <tr key={submission.id} className="border-t border-neutral-800 text-neutral-300"><td className="p-2 font-medium text-white">{submission.problem.title}</td><td className={`p-2 font-mono ${submission.verdict === "ACCEPTED" ? "text-emerald-300" : "text-red-300"}`}>{submission.verdict}</td><td className="p-2">{submission.score}</td><td className="p-2 font-mono">{submission.language}</td><td className="p-2 text-neutral-500">{formatDate(submission.submittedAt)}</td></tr>)}{user.submissions.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-neutral-500">Chưa có submission.</td></tr>}</tbody></table></div></section>
  </div>;
}
