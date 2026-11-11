"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Code2, Filter, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAcceptanceRate } from "@/lib/utils";
import { buildProblemLibraryQuery } from "@/lib/problem-library";

const DIFFICULTIES = ["BEGINNER", "EASY", "MEDIUM", "HARD", "EXPERT"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];
interface ProblemRow {
  id: string; slug: string; title: string; difficulty: Difficulty;
  totalSubmissions: number; acceptedSubmissions: number;
  tags: { tag: { id: string; name: string; slug: string; color: string | null } }[];
}
interface ProblemTag { id: string; name: string; slug: string; color: string | null }
interface Props {
  initialProblems: ProblemRow[]; initialTags: ProblemTag[]; initialTotal: number; initialPage: number;
  initialSearch: string; initialDifficulty: string; initialTag: string; initialError?: boolean;
  user: { username?: string; fighterId?: string; role?: string } | null;
}
const difficultyLabel: Record<Difficulty, string> = { BEGINNER: "Cơ Bản", EASY: "Dễ", MEDIUM: "Trung Bình", HARD: "Khó", EXPERT: "Chuyên Gia" };
const difficultyClass: Record<Difficulty, string> = {
  BEGINNER: "bg-neutral-800 text-neutral-300", EASY: "bg-emerald-950 text-emerald-400 border-emerald-900/60",
  MEDIUM: "bg-amber-950 text-amber-400 border-amber-900/60", HARD: "bg-orange-950 text-orange-400 border-orange-900/60",
  EXPERT: "bg-red-950 text-red-400 border-red-900/60",
};

export function ProblemLibrary({ initialProblems, initialTags, initialTotal, initialPage, initialSearch, initialDifficulty, initialTag, initialError = false, user }: Props) {
  const [search, setSearch] = useState(initialSearch);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [tag, setTag] = useState(initialTag);
  const [page, setPage] = useState(initialPage);
  const [problems, setProblems] = useState(initialProblems);
  const [total, setTotal] = useState(initialTotal);
  const [tags, setTags] = useState(initialTags);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const totalPages = Math.max(1, Math.ceil(total / 20));

  function buildQuery(nextPage: number, nextSearch = search, nextDifficulty = difficulty, nextTag = tag) {
    return buildProblemLibraryQuery({ page: nextPage, search: nextSearch, difficulty: nextDifficulty, tag: nextTag });
  }

  async function refresh(nextPage = page, nextSearch = search, nextDifficulty = difficulty, nextTag = tag) {
    setPage(nextPage); setLoading(true); setError(false);
    const query = buildQuery(nextPage, nextSearch, nextDifficulty, nextTag);
    try {
      const response = await fetch(`/api/problems?${query}`);
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const data = await response.json();
      setProblems(data.problems); setTotal(data.pagination.total); setTags(data.tags ?? initialTags);
      window.history.replaceState(null, "", `/problems?${query}`);
    } catch {
      setError(true); setProblems([]); setTotal(0);
    } finally { setLoading(false); }
  }
  function updateFilter(next: { difficulty?: string; tag?: string }) {
    const nextDifficulty = next.difficulty ?? difficulty;
    const nextTag = next.tag ?? tag;
    setDifficulty(nextDifficulty); setTag(nextTag); setPage(1);
    void refresh(1, search, nextDifficulty, nextTag);
  }
  const searchSubmit = (event: React.FormEvent) => { event.preventDefault(); void refresh(1); };

  return <div className="flex min-h-screen flex-col bg-[#101114]">
    <header className="border-b border-neutral-800 bg-[#14161b]"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
      <Link href="/" className="font-mono text-lg font-extrabold text-white">CODE<span className="text-[#E63946]">FIGHTER</span></Link>
      <nav className="flex items-center gap-4 text-sm text-neutral-300"><Link href="/problems" className="text-white">Bài tập</Link><Link href="/leaderboard">Bảng xếp hạng</Link>{user ? <Link href="/dashboard">Hồ sơ {user.username}</Link> : <Link href="/login">Đăng nhập</Link>}</nav>
    </div></header>
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-[#E63946]"><Code2 className="h-5 w-5"/><span className="text-xs font-mono uppercase">Training Ground</span></div><h1 className="text-2xl font-bold text-white">Thư viện bài tập</h1><p className="mt-1 text-sm text-neutral-400">Tìm thử thách phù hợp và theo dõi kết quả giải.</p></div><div className="text-sm text-neutral-400">{loading ? "Đang tải..." : `${total.toLocaleString()} bài tập`}</div></div>
      <form onSubmit={searchSubmit} className="mb-4 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500"/><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên hoặc mã bài..." className="border-neutral-700 bg-[#17191e] pl-9"/></div><Button type="submit" variant="fighter" disabled={loading}><Search className="mr-2 h-4 w-4"/>Tìm bài</Button>{(search || difficulty || tag) && <Button type="button" variant="outline" onClick={() => { setSearch(""); setDifficulty(""); setTag(""); setPage(1); void refresh(1, "", "", ""); }}><X className="mr-1 h-4 w-4"/>Xóa lọc</Button>}</form>
      <div className="mb-4 flex flex-wrap items-center gap-2"><span className="mr-1 flex items-center gap-1 text-xs text-neutral-500"><Filter className="h-3.5 w-3.5"/>Độ khó</span><Button size="sm" variant={!difficulty ? "secondary" : "ghost"} onClick={() => updateFilter({difficulty:""})}>Tất cả</Button>{DIFFICULTIES.map((value) => <Button key={value} size="sm" variant={difficulty === value ? "secondary" : "ghost"} onClick={() => updateFilter({difficulty:value})}>{difficultyLabel[value]}</Button>)}</div>
      {tags.length > 0 && <div className="mb-5 flex flex-wrap items-center gap-2"><span className="mr-1 text-xs text-neutral-500">Chủ đề</span>{tags.map((item) => <button key={item.id} onClick={() => updateFilter({tag:tag === item.slug ? "" : item.slug})} className={`rounded border px-2.5 py-1 text-xs ${tag === item.slug ? "border-red-700 bg-red-950 text-red-300" : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"}`}>{item.name}</button>)}</div>}
      {error && <div role="alert" className="mb-4 border-l-2 border-amber-500 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">Không tải được dữ liệu bài tập. Kiểm tra kết nối máy chủ/cơ sở dữ liệu rồi thử lại.</div>}
      <div className="overflow-x-auto border-y border-neutral-800"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-neutral-900/70 text-xs uppercase text-neutral-400"><tr><th className="w-16 px-3 py-3 text-center">#</th><th className="px-3 py-3">Bài tập</th><th className="px-3 py-3">Độ khó</th><th className="px-3 py-3">Chủ đề</th><th className="px-3 py-3 text-right">Tỉ lệ AC</th><th className="px-3 py-3 text-right">Lượt nộp</th></tr></thead><tbody className={loading ? "opacity-50" : ""}>
        {problems.map((problem,index) => <tr key={problem.id} className="border-t border-neutral-800 hover:bg-neutral-900/50"><td className="px-3 py-3 text-center font-mono text-xs text-neutral-500">{(page-1)*20+index+1}</td><td className="px-3 py-3"><Link href={`/problems/${problem.slug}`} className="font-medium text-neutral-100 hover:text-red-400">{problem.title}</Link><div className="font-mono text-[11px] text-neutral-500">{problem.slug}</div></td><td className="px-3 py-3"><Badge className={difficultyClass[problem.difficulty]}>{difficultyLabel[problem.difficulty]}</Badge></td><td className="px-3 py-3"><div className="flex flex-wrap gap-1">{problem.tags.map(({tag:item}) => <span key={item.id} className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-400">{item.name}</span>)}</div></td><td className="px-3 py-3 text-right font-mono text-xs text-neutral-300">{getAcceptanceRate(problem.acceptedSubmissions,problem.totalSubmissions)}</td><td className="px-3 py-3 text-right font-mono text-xs text-neutral-400">{problem.totalSubmissions.toLocaleString()}</td></tr>)}
        {!problems.length && <tr><td colSpan={6} className="px-4 py-16 text-center"><div className="text-sm font-medium text-neutral-300">{error ? "Không có dữ liệu do lỗi kết nối." : "Chưa có bài tập để hiển thị"}</div><p className="mt-1 text-xs text-neutral-500">{error ? "Hãy thử lại sau khi máy chủ cơ sở dữ liệu hoạt động." : search||difficulty||tag ? "Thử xóa bớt bộ lọc." : "Bài tập sẽ xuất hiện tại đây khi dữ liệu được nạp."}</p></td></tr>}
      </tbody></table></div>
      <div className="mt-4 flex items-center justify-between text-xs text-neutral-500"><span>Trang {page} / {totalPages}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page<=1||loading} onClick={() => void refresh(page-1)} aria-label="Trang trước"><ChevronLeft className="h-4 w-4"/></Button><Button size="sm" variant="outline" disabled={page>=totalPages||loading} onClick={() => void refresh(page+1)} aria-label="Trang sau"><ChevronRight className="h-4 w-4"/></Button></div></div>
    </main><footer className="border-t border-neutral-800 px-4 py-4 text-center text-xs text-neutral-500">CODE FIGHTER OJ · TRAIN LIKE A FIGHTER. CODE LIKE A CHAMPION.</footer>
  </div>;
}
