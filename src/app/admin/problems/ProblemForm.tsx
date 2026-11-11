"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, ArrowLeft, Save, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  initialProblem?: any;
  tags: Tag[];
  isEdit?: boolean;
}

export function ProblemForm({ initialProblem, tags, isEdit = false }: Props) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: initialProblem?.title || "",
    slug: initialProblem?.slug || "",
    statement: initialProblem?.statement || "",
    inputFormat: initialProblem?.inputFormat || "",
    outputFormat: initialProblem?.outputFormat || "",
    constraints: initialProblem?.constraints || "",
    difficulty: initialProblem?.difficulty || "EASY",
    visibility: initialProblem?.visibility || "PUBLIC",
    timeLimit: initialProblem?.timeLimit || 1000,
    memoryLimit: initialProblem?.memoryLimit || 262144,
  });

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialProblem?.tags?.map((t: any) => t.tagId) || []
  );

  const [sampleTests, setSampleTests] = useState<{ input: string; output: string }[]>(
    initialProblem?.testCases?.map((tc: any) => ({
      input: tc.inputData,
      output: tc.outputData,
    })) || [{ input: "", output: "" }]
  );

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTitleChange = (val: string) => {
    setFormData((prev) => {
      const next: any = { ...prev, title: val };
      if (!isEdit && !prev.slug) {
        // Auto-slugify
        next.slug = val
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }
      return next;
    });
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const addSampleTest = () => {
    setSampleTests((prev) => [...prev, { input: "", output: "" }]);
  };

  const removeSampleTest = (index: number) => {
    setSampleTests((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSampleTest = (index: number, field: "input" | "output", val: string) => {
    setSampleTests((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isEdit
        ? `/api/admin/problems/${initialProblem.id}`
        : "/api/admin/problems";
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...formData,
        tagIds: selectedTagIds,
        testCases: sampleTests
          .filter((t) => t.input.trim() || t.output.trim())
          .map((t) => ({
            inputData: t.input,
            outputData: t.output,
            isSample: true,
            isHidden: false,
            points: 10,
          })),
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Không thể lưu bài tập.");
      } else {
        router.push("/admin/problems");
        router.refresh();
      }
    } catch (err) {
      setError("Đã xảy ra lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Metadata */}
      <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
          1. Thông Tin Cơ Bản
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tên Thử Thách (Tiêu đề bài toán)</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Ví dụ: Hai Con Trỏ Tìm Cặp Số"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (Mã URL duy nhất)</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, slug: e.target.value }))
              }
              placeholder="hai-con-tro-tim-cap-so"
              className="font-mono text-xs"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="difficulty">Độ Khó</Label>
            <select
              id="difficulty"
              value={formData.difficulty}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, difficulty: e.target.value }))
              }
              className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-xs text-white"
            >
              <option value="BEGINNER">Cơ Bản (Beginner)</option>
              <option value="EASY">Dễ (Easy)</option>
              <option value="MEDIUM">Trung Bình (Medium)</option>
              <option value="HARD">Khó (Hard)</option>
              <option value="EXPERT">Chuyên Gia (Expert)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Quyền Truy Cập</Label>
            <select
              id="visibility"
              value={formData.visibility}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, visibility: e.target.value }))
              }
              className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-xs text-white"
            >
              <option value="PUBLIC">Công Khai (Public)</option>
              <option value="PRIVATE">Học Viện Nội Bộ (Private)</option>
              <option value="UNLISTED">Không Công Khai (Unlisted)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeLimit">Thời Gian (ms)</Label>
            <Input
              id="timeLimit"
              type="number"
              value={formData.timeLimit}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  timeLimit: parseInt(e.target.value, 10),
                }))
              }
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="memoryLimit">Bộ Nhớ (KB)</Label>
            <Input
              id="memoryLimit"
              type="number"
              value={formData.memoryLimit}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  memoryLimit: parseInt(e.target.value, 10),
                }))
              }
              className="font-mono text-xs"
            />
          </div>
        </div>

        {/* Tags Selection */}
        <div className="space-y-2 pt-2">
          <Label>Chủ Đề (Tags)</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const selected = selectedTagIds.includes(tag.id);
              return (
                <button
                  type="button"
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    selected
                      ? "bg-[#E63946] text-white font-semibold"
                      : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Statement & Formats */}
      <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
          2. Nội Dung Đề Bài (Hỗ trợ Markdown & Công thức)
        </h2>

        <div className="space-y-2">
          <Label htmlFor="statement">Mô Tả Bài Toán</Label>
          <textarea
            id="statement"
            rows={8}
            value={formData.statement}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, statement: e.target.value }))
              }
            placeholder="Nhập đề bài chi tiết bằng Markdown..."
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 p-3 font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inputFormat">Quy Cách Dữ Liệu Vào (Input Format)</Label>
            <textarea
              id="inputFormat"
              rows={3}
              value={formData.inputFormat}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, inputFormat: e.target.value }))
              }
              placeholder="Dòng đầu chứa N..."
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 p-3 font-mono text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="outputFormat">Quy Cách Dữ Liệu Ra (Output Format)</Label>
            <textarea
              id="outputFormat"
              rows={3}
              value={formData.outputFormat}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, outputFormat: e.target.value }))
              }
              placeholder="In ra một số nguyên..."
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 p-3 font-mono text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="constraints">Giới Hạn & Ràng Buộc (Constraints)</Label>
          <Input
            id="constraints"
            value={formData.constraints}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, constraints: e.target.value }))
            }
            placeholder="1 <= N <= 10^5, -10^9 <= A[i] <= 10^9"
            className="font-mono text-xs"
          />
        </div>
      </div>

      {/* Sample Tests */}
      {!isEdit && (
        <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              3. Ví Dụ Mẫu (Sample Tests)
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSampleTest}
              className="gap-1 text-xs"
            >
              <Plus className="h-3 w-3" /> Thêm Ví Dụ
            </Button>
          </div>

          <div className="space-y-4">
            {sampleTests.map((test, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/60 space-y-3"
              >
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span>Ví Dụ #{index + 1}</span>
                  {sampleTests.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSampleTest(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] text-neutral-400">Input Data:</Label>
                    <textarea
                      rows={3}
                      value={test.input}
                      onChange={(e) => updateSampleTest(index, "input", e.target.value)}
                      placeholder="Dữ liệu vào..."
                      className="mt-1 w-full rounded border border-neutral-800 bg-neutral-950 p-2 font-mono text-xs text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-neutral-400">Output Data:</Label>
                    <textarea
                      rows={3}
                      value={test.output}
                      onChange={(e) => updateSampleTest(index, "output", e.target.value)}
                      placeholder="Dữ liệu ra mong đợi..."
                      className="mt-1 w-full rounded border border-neutral-800 bg-neutral-950 p-2 font-mono text-xs text-emerald-400"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Link href="/admin/problems">
          <Button variant="outline" type="button" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Quay Lại
          </Button>
        </Link>

        <Button variant="fighter" type="submit" disabled={loading} className="gap-1.5 text-xs">
          <Save className="h-3.5 w-3.5" />
          {loading ? "Đang Lưu..." : isEdit ? "Cập Nhật Bài Tập" : "Xuất Bản Bài Tập"}
        </Button>
      </div>
    </form>
  );
}
