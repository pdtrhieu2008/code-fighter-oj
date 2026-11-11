"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Send, Terminal, Clock, Cpu } from "lucide-react";

type SupportedLanguage = "CPP17" | "CPP20" | "PYTHON3" | "JAVA";
type TestCase = { id: string; inputData: string; outputData: string };
type Problem = {
  id: string;
  slug: string;
  title: string;
  statement: string;
  inputFormat?: string | null;
  outputFormat?: string | null;
  constraints?: string | null;
  difficulty: string;
  tags: { tag: { id: string; name: string } }[];
  testCases: TestCase[];
};
type VerdictResult = {
  verdict: string;
  score?: number;
  executionTime?: number;
  memoryUsed?: number;
  output?: string;
  message?: string;
  error?: string;
  compilerOutput?: string;
};

type Props = { problem: Problem; isLoggedIn: boolean; userId: string | null };

const TEMPLATES: Record<SupportedLanguage, string> = {
  CPP17: `#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // TODO: implement solution\n    return 0;\n}\n`,
  CPP20: `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // TODO: implement solution\n    return 0;\n}\n`,
  PYTHON3: `import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    # TODO: implement solution\n\nif __name__ == "__main__":\n    main()\n`,
  JAVA: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        // TODO: implement solution\n    }\n}\n`,
};

const MONACO_LANGUAGE: Record<SupportedLanguage, string> = {
  CPP17: "cpp",
  CPP20: "cpp",
  PYTHON3: "python",
  JAVA: "java",
};

function draftKey(userId: string | null, problemId: string, language: SupportedLanguage) {
  return `code-fighter:draft:${userId ?? "guest"}:${problemId}:${language}`;
}

function readDraft(userId: string | null, problemId: string, language: SupportedLanguage) {
  if (typeof window === "undefined") return TEMPLATES[language];
  return window.localStorage.getItem(draftKey(userId, problemId, language)) ?? TEMPLATES[language];
}

export function ProblemSolver({ problem, isLoggedIn, userId }: Props) {
  const [language, setLanguage] = useState<SupportedLanguage>("CPP17");
  const [sourceCode, setSourceCode] = useState(() => readDraft(userId, problem.id, "CPP17"));
  const [customInput, setCustomInput] = useState(problem.testCases[0]?.inputData ?? "");
  const [activeTab, setActiveTab] = useState("custom-input");
  const [judging, setJudging] = useState(false);
  const [verdict, setVerdict] = useState<VerdictResult | null>(null);

  const storageKey = draftKey(userId, problem.id, language);

  useEffect(() => {
    window.localStorage.setItem(storageKey, sourceCode);
  }, [storageKey, sourceCode]);

  const handleLanguageChange = (value: string) => {
    if (value in TEMPLATES) {
      const nextLanguage = value as SupportedLanguage;
      setSourceCode(readDraft(userId, problem.id, nextLanguage));
      setLanguage(nextLanguage);
    }
  };

  const execute = async (kind: "run" | "submit") => {
    if (kind === "submit" && !isLoggedIn) {
      setVerdict({ verdict: "AUTH_REQUIRED", message: "Vui lòng đăng nhập để nộp bài." });
      setActiveTab("verdict");
      return;
    }

    setJudging(true);
    setVerdict(null);
    setActiveTab("verdict");
    try {
      const response = await fetch(kind === "run" ? "/api/judge/run" : "/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kind === "run"
          ? { sourceCode, language, input: customInput }
          : { problemId: problem.id, sourceCode, language }),
      });
      const data = await response.json();
      setVerdict(response.ok ? data : {
        verdict: "REQUEST_FAILED",
        error: data.error ?? "Yêu cầu không thành công.",
      });
    } catch {
      setVerdict({ verdict: "SYSTEM_ERROR", error: "Không thể kết nối tới dịch vụ chấm." });
    } finally {
      setJudging(false);
    }
  };

  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-12">
      <section className="flex max-h-[820px] flex-col space-y-5 overflow-y-auto rounded-lg border border-neutral-800 bg-[#16181D] p-6 lg:col-span-6" aria-label="Problem statement">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary" className="bg-neutral-800 text-neutral-300">{problem.difficulty}</Badge>
            <span className="font-mono text-xs text-neutral-500">{problem.slug}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{problem.title}</h1>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {problem.tags.map(({ tag }) => <span key={tag.id} className="rounded bg-neutral-800 px-2 py-0.5 font-mono text-[11px] text-neutral-400">{tag.name}</span>)}
          </div>
        </div>
        <div className="space-y-6 border-t border-neutral-800/80 pt-4 text-sm text-neutral-300">
          <section><h2 className="mb-2 text-xs font-semibold uppercase text-neutral-400">Đề bài</h2><div className="whitespace-pre-line leading-relaxed text-neutral-200">{problem.statement}</div></section>
          {problem.inputFormat && <section><h2 className="mb-2 text-xs font-semibold uppercase text-neutral-400">Dữ liệu vào</h2><pre className="whitespace-pre-wrap rounded border border-neutral-800 bg-neutral-900/60 p-3 font-mono text-xs">{problem.inputFormat}</pre></section>}
          {problem.outputFormat && <section><h2 className="mb-2 text-xs font-semibold uppercase text-neutral-400">Dữ liệu ra</h2><pre className="whitespace-pre-wrap rounded border border-neutral-800 bg-neutral-900/60 p-3 font-mono text-xs">{problem.outputFormat}</pre></section>}
          {problem.constraints && <section><h2 className="mb-2 text-xs font-semibold uppercase text-neutral-400">Giới hạn</h2><pre className="whitespace-pre-wrap rounded border border-neutral-800 bg-neutral-900/60 p-3 font-mono text-xs">{problem.constraints}</pre></section>}
          {problem.testCases.length > 0 && <section><h2 className="mb-3 text-xs font-semibold uppercase text-neutral-400">Ví dụ mẫu</h2><div className="space-y-3">{problem.testCases.map((testCase, index) => <div key={testCase.id} className="space-y-2 rounded border border-neutral-800 bg-neutral-900/80 p-3 font-mono text-xs"><div className="text-[11px] uppercase text-neutral-500">Ví dụ #{index + 1}</div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><div className="mb-1 text-[10px] text-neutral-400">Input</div><pre className="overflow-x-auto rounded border border-neutral-800 bg-[#101114] p-2">{testCase.inputData || "(rỗng)"}</pre></div><div><div className="mb-1 text-[10px] text-neutral-400">Output</div><pre className="overflow-x-auto rounded border border-neutral-800 bg-[#101114] p-2 text-emerald-400">{testCase.outputData}</pre></div></div></div>)}</div></section>}
        </div>
      </section>

      <section className="flex flex-col space-y-4 lg:col-span-6" aria-label="Code editor">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-[#16181D] px-4 py-3">
          <label className="flex items-center gap-2 font-mono text-xs text-neutral-400">Ngôn ngữ
            <select value={language} onChange={(event) => handleLanguageChange(event.target.value)} className="cursor-pointer rounded border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500">
              <option value="CPP17">C++17</option><option value="CPP20">C++20</option><option value="PYTHON3">Python 3</option><option value="JAVA">Java</option>
            </select>
          </label>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void execute("run")} disabled={judging} className="h-8 gap-1.5 text-xs"><Play className="h-3.5 w-3.5 text-emerald-400" />Chạy thử</Button>
            <Button variant="fighter" size="sm" onClick={() => void execute("submit")} disabled={judging} className="h-8 gap-1.5 text-xs"><Send className="h-3.5 w-3.5" />Nộp bài</Button>
          </div>
        </div>

        <div className="flex min-h-[400px] flex-1 flex-col overflow-hidden rounded-lg border border-neutral-800 bg-[#0E0F12]">
          <div className="flex items-center justify-between border-b border-neutral-800 bg-[#14161C] px-4 py-2 font-mono text-xs text-neutral-400"><span className="flex items-center gap-2"><Terminal className="h-3.5 w-3.5" />CODE FIGHTER Editor</span><span className="text-[10px] text-neutral-500">{language} | UTF-8</span></div>
          <Editor height="440px" language={MONACO_LANGUAGE[language]} value={sourceCode} onChange={(value) => setSourceCode(value ?? "")} theme="vs-dark" options={{ automaticLayout: true, fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, tabSize: 4, wordWrap: "on", lineNumbers: "on", padding: { top: 12 } }} loading={<div className="p-4 font-mono text-xs text-neutral-500">Đang tải Monaco Editor...</div>} />
        </div>

        <div className="rounded-lg border border-neutral-800 bg-[#16181D] p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-3"><TabsTrigger value="custom-input" className="text-xs">Custom input</TabsTrigger><TabsTrigger value="verdict" className="text-xs">Kết quả</TabsTrigger></TabsList>
            <TabsContent value="custom-input"><textarea value={customInput} onChange={(event) => setCustomInput(event.target.value)} placeholder="Nhập stdin để chạy thử..." className="h-20 w-full rounded border border-neutral-800 bg-neutral-900 p-2.5 font-mono text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-500" /></TabsContent>
            <TabsContent value="verdict">
              {judging ? <div className="flex items-center justify-center gap-2 py-6 font-mono text-xs text-neutral-400"><span className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />Đang chấm bài...</div> : verdict ? <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="font-mono text-xs text-neutral-400">Verdict</span><span className={`rounded border px-2 py-0.5 font-mono text-xs font-bold ${verdict.verdict === "ACCEPTED" ? "border-emerald-800 bg-emerald-950 text-emerald-400" : "border-red-800 bg-red-950 text-red-400"}`}>{verdict.verdict}</span></div>
                  {verdict.executionTime !== undefined && <div className="flex gap-3 font-mono text-xs text-neutral-400"><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{verdict.executionTime} ms</span><span className="flex items-center gap-1"><Cpu className="h-3 w-3" />{verdict.memoryUsed ?? 0} KB</span></div>}
                </div>
                {verdict.score !== undefined && <div className="text-xs text-neutral-400">Điểm: {verdict.score}</div>}
                {verdict.output !== undefined && <pre className="max-h-32 overflow-auto rounded border border-neutral-800 bg-neutral-900 p-2.5 font-mono text-xs text-neutral-200">{verdict.output || "(không có output)"}</pre>}
                {(verdict.message || verdict.error || verdict.compilerOutput) && <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded border border-neutral-800 bg-neutral-900/60 p-2.5 text-xs text-neutral-300">{verdict.error ?? verdict.compilerOutput ?? verdict.message}</pre>}
              </div> : <div className="py-4 text-center font-mono text-xs text-neutral-500">Chưa có kết quả. Chọn Chạy thử hoặc Nộp bài.</div>}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
