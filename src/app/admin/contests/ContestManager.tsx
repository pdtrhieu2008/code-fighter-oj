"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Save, Search, Swords } from "lucide-react";

type ContestRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  type: string;
  scoringType: string;
  startTime: string;
  endTime: string;
  participants: number;
  problemCount: number;
};
type ProblemOption = { id: string; title: string; slug: string };

const STATUSES = ["DRAFT", "PUBLISHED", "REGISTRATION", "ACTIVE", "ENDED", "ARCHIVED"];

export function ContestManager({ initialContests, problems }: { initialContests: ContestRow[]; problems: ProblemOption[] }) {
  const router = useRouter();
  const [contests, setContests] = useState(initialContests);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ title: "", slug: "", description: "", type: "PUBLIC", scoringType: "ICPC", startTime: "", endTime: "", problemIds: [] as string[] });
  const filtered = useMemo(() => contests.filter((contest) => `${contest.title} ${contest.slug} ${contest.status}`.toLowerCase().includes(query.toLowerCase())), [contests, query]);

  const setField = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const updateStatus = async (contestId: string, status: string) => {
    setBusyId(contestId); setError(""); setSuccess("");
    try {
      const response = await fetch(`/api/admin/contests/${contestId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không cập nhật được trạng thái.");
      setContests((rows) => rows.map((row) => row.id === contestId ? { ...row, status: data.contest.status } : row));
      setSuccess("Đã cập nhật trạng thái giải đấu."); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Lỗi kết nối."); }
    finally { setBusyId(""); }
  };

  const createContest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusyId("create"); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/contests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, startTime: new Date(form.startTime).toISOString(), endTime: new Date(form.endTime).toISOString() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không tạo được giải đấu.");
      setSuccess(`Đã tạo giải đấu ${data.contest.title}.`);
      setForm({ title: "", slug: "", description: "", type: "PUBLIC", scoringType: "ICPC", startTime: "", endTime: "", problemIds: [] });
      router.refresh(); window.location.reload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Lỗi kết nối."); }
    finally { setBusyId(""); }
  };

  return <div className="space-y-7">
    <header className="flex items-center gap-3 border-b border-neutral-800 pb-5"><Swords className="h-6 w-6 text-amber-400"/><div><h1 className="text-xl font-bold text-white">Quản lý Contest</h1><p className="mt-1 text-xs text-neutral-400">Tạo giải đấu, gắn bài và điều khiển trạng thái đăng ký.</p></div></header>
    {(error || success) && <p role="status" className={`border px-3 py-2 text-sm ${error ? "border-red-900 text-red-300" : "border-emerald-900 text-emerald-300"}`}>{error || success}</p>}

    <section className="border border-neutral-800 bg-[#16181D] p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><Plus className="h-4 w-4 text-red-400"/>Tạo giải đấu</h2>
      <form onSubmit={createContest} className="grid gap-3 md:grid-cols-2">
        <Input required maxLength={120} placeholder="Tên giải đấu" value={form.title} onChange={(e) => setField("title", e.target.value)} className="border-neutral-700 bg-neutral-900"/>
        <Input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={100} placeholder="slug-giai-dau" value={form.slug} onChange={(e) => setField("slug", e.target.value)} className="border-neutral-700 bg-neutral-900"/>
        <textarea required value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="Mô tả" className="min-h-20 border border-neutral-700 bg-neutral-900 p-2 text-sm text-white md:col-span-2"/>
        <label className="text-xs text-neutral-400">Bắt đầu<input required type="datetime-local" value={form.startTime} onChange={(e) => setField("startTime", e.target.value)} className="mt-1 block w-full border border-neutral-700 bg-neutral-900 p-2 text-white"/></label>
        <label className="text-xs text-neutral-400">Kết thúc<input required type="datetime-local" value={form.endTime} onChange={(e) => setField("endTime", e.target.value)} className="mt-1 block w-full border border-neutral-700 bg-neutral-900 p-2 text-white"/></label>
        <label className="text-xs text-neutral-400">Loại<select value={form.type} onChange={(e) => setField("type", e.target.value)} className="mt-1 block w-full border border-neutral-700 bg-neutral-900 p-2 text-white"><option>PUBLIC</option><option>PRIVATE</option><option>GROUP</option><option>CLASS</option><option>BELT_SPECIFIC</option><option>VIRTUAL</option></select></label>
        <label className="text-xs text-neutral-400">Chấm điểm<select value={form.scoringType} onChange={(e) => setField("scoringType", e.target.value)} className="mt-1 block w-full border border-neutral-700 bg-neutral-900 p-2 text-white"><option>ICPC</option><option>IOI</option><option>CUSTOM</option></select></label>
        <label className="text-xs text-neutral-400 md:col-span-2">Bài tập<select multiple value={form.problemIds} onChange={(e) => setForm((current) => ({ ...current, problemIds: Array.from(e.target.selectedOptions, (option) => option.value) }))} className="mt-1 block min-h-28 w-full border border-neutral-700 bg-neutral-900 p-2 text-white">{problems.map((problem) => <option key={problem.id} value={problem.id}>{problem.title} ({problem.slug})</option>)}</select></label>
        <div className="md:col-span-2"><Button type="submit" disabled={busyId === "create"} className="gap-2"><Save className="h-4 w-4"/>{busyId === "create" ? "Đang tạo..." : "Tạo contest"}</Button></div>
      </form>
    </section>

    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold text-white">Danh sách giải ({filtered.length})</h2><div className="relative w-full max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500"/><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm giải đấu..." className="border-neutral-700 bg-[#16181D] pl-9"/></div></div>
      <div className="overflow-x-auto border border-neutral-800"><table className="w-full text-left text-xs"><thead className="bg-neutral-900 text-neutral-400"><tr><th className="p-3">Giải đấu</th><th className="p-3">Lịch</th><th className="p-3">Bài / Người</th><th className="p-3">Trạng thái</th><th className="p-3">Đổi trạng thái</th></tr></thead><tbody>{filtered.map((contest) => <tr key={contest.id} className="border-t border-neutral-800 text-neutral-300"><td className="p-3"><a className="font-medium text-white hover:text-red-300" href={`/contests/${contest.slug}`}>{contest.title}</a><div className="font-mono text-[10px] text-neutral-500">{contest.slug} · {contest.type} · {contest.scoringType}</div></td><td className="p-3 whitespace-nowrap">{new Date(contest.startTime).toLocaleString()}<div className="text-neutral-500">đến {new Date(contest.endTime).toLocaleString()}</div></td><td className="p-3">{contest.problemCount} bài · {contest.participants} người</td><td className="p-3 font-mono">{contest.status}</td><td className="p-3"><select aria-label={`Đổi trạng thái ${contest.title}`} disabled={busyId === contest.id} value={contest.status} onChange={(e) => void updateStatus(contest.id, e.target.value)} className="border border-neutral-700 bg-neutral-900 p-1.5 text-white">{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></td></tr>)}{filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-neutral-500">Chưa có giải đấu phù hợp.</td></tr>}</tbody></table></div>
    </section>
  </div>;
}
