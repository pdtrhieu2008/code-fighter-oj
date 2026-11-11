"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Trash2,
  FileCode,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface TestCase {
  id: string;
  problemId: string;
  inputData: string;
  outputData: string;
  isSample: boolean;
  isHidden: boolean;
  points: number;
  timeLimit: number | null;
  memoryLimit: number | null;
  orderIndex: number;
}

interface Props {
  problem: {
    id: string;
    title: string;
    slug: string;
  };
  initialTestCases: TestCase[];
}

export function TestCaseManager({ problem, initialTestCases }: Props) {
  const router = useRouter();
  const [testCases, setTestCases] = useState<TestCase[]>(initialTestCases);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // New TestCase Form
  const [newTestCase, setNewTestCase] = useState({
    inputData: "",
    outputData: "",
    isSample: false,
    isHidden: true,
    points: 10,
    timeLimit: "",
    memoryLimit: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/problems/${problem.id}/testcases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTestCase),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể tạo test case.");
      } else {
        setTestCases((prev) => [...prev, data.testCase]);
        setIsAdding(false);
        setNewTestCase({
          inputData: "",
          outputData: "",
          isSample: false,
          isHidden: true,
          points: 10,
          timeLimit: "",
          memoryLimit: "",
        });
        router.refresh();
      }
    } catch (err) {
      setError("Đã xảy ra lỗi khi tạo test case.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (testcaseId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa test case này không?")) return;

    try {
      const res = await fetch(
        `/api/admin/problems/${problem.id}/testcases/${testcaseId}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        setTestCases((prev) => prev.filter((tc) => tc.id !== testcaseId));
        router.refresh();
      } else {
        alert("Không thể xóa test case.");
      }
    } catch (err) {
      alert("Lỗi kết nối khi xóa test case.");
    }
  };

  const totalPoints = testCases.reduce((acc, tc) => acc + tc.points, 0);

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Header */}
      <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white">
            Bộ Kiểm Thử & Chấm Điểm
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Tổng cộng <strong className="text-white">{testCases.length}</strong> test cases &bull; Tổng điểm: <strong className="text-emerald-400">{totalPoints}</strong> pts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/problems">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> Danh Sách Bài
            </Button>
          </Link>
          <Button
            variant="fighter"
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
            className="gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Thêm Test Case
          </Button>
        </div>
      </div>

      {/* Add Test Case Form Drawer */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-neutral-800 bg-[#16181D] p-6 space-y-4 animate-in fade-in duration-200"
        >
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Thêm Test Case Mới
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Dữ Liệu Đầu Vào (Input Data / Stdin)</Label>
              <textarea
                rows={5}
                value={newTestCase.inputData}
                onChange={(e) =>
                  setNewTestCase((prev) => ({ ...prev, inputData: e.target.value }))
                }
                placeholder="Nhập stdin chuẩn..."
                className="w-full rounded border border-neutral-800 bg-neutral-900 p-3 font-mono text-xs text-white focus:outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Dữ Liệu Đầu Ra Mong Đợi (Expected Output / Stdout)</Label>
              <textarea
                rows={5}
                value={newTestCase.outputData}
                onChange={(e) =>
                  setNewTestCase((prev) => ({ ...prev, outputData: e.target.value }))
                }
                placeholder="Nhập stdout chuẩn..."
                className="w-full rounded border border-neutral-800 bg-neutral-900 p-3 font-mono text-xs text-emerald-400 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Điểm (Points)</Label>
              <Input
                type="number"
                value={newTestCase.points}
                onChange={(e) =>
                  setNewTestCase((prev) => ({
                    ...prev,
                    points: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="font-mono text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isSample"
                checked={newTestCase.isSample}
                onChange={(e) =>
                  setNewTestCase((prev) => ({
                    ...prev,
                    isSample: e.target.checked,
                    isHidden: !e.target.checked ? true : prev.isHidden,
                  }))
                }
                className="rounded border-neutral-700"
              />
              <Label htmlFor="isSample" className="text-xs cursor-pointer">
                Là Ví Dụ Mẫu (Sample)
              </Label>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isHidden"
                checked={newTestCase.isHidden}
                onChange={(e) =>
                  setNewTestCase((prev) => ({
                    ...prev,
                    isHidden: e.target.checked,
                  }))
                }
                className="rounded border-neutral-700"
              />
              <Label htmlFor="isHidden" className="text-xs cursor-pointer">
                Ẩn Khỏi Thí Sinh (Hidden)
              </Label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(false)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="fighter"
              size="sm"
              disabled={loading}
              className="text-xs"
            >
              {loading ? "Đang Lưu..." : "Lưu Test Case"}
            </Button>
          </div>
        </form>
      )}

      {/* Test Cases Table */}
      <div className="rounded-xl border border-neutral-800 bg-[#16181D] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-800">
              <TableHead className="w-16 font-mono text-center">STT</TableHead>
              <TableHead className="w-24">Phân Loại</TableHead>
              <TableHead className="w-24">Bảo Mật</TableHead>
              <TableHead className="w-20 text-right">Điểm</TableHead>
              <TableHead>Dữ Liệu Đầu Vào (Input)</TableHead>
              <TableHead>Dữ Liệu Đầu Ra (Expected)</TableHead>
              <TableHead className="w-20 text-right">Xóa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testCases.length > 0 ? (
              testCases.map((tc, idx) => (
                <TableRow key={tc.id} className="border-neutral-800">
                  <TableCell className="font-mono text-xs text-neutral-500 text-center">
                    #{idx + 1}
                  </TableCell>
                  <TableCell>
                    {tc.isSample ? (
                      <Badge className="bg-blue-950 text-blue-400 border border-blue-900 text-[10px]">
                        Ví Dụ
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Chính Quy
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {tc.isHidden ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-purple-400">
                        <EyeOff className="h-3 w-3" /> Test Ẩn
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-400">
                        <Eye className="h-3 w-3" /> Công Khai
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold text-emerald-400">
                    {tc.points} pts
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-neutral-300 max-w-xs truncate">
                    {tc.inputData ? tc.inputData.replace(/\n/g, " ↵ ") : "(rỗng)"}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-emerald-400 max-w-xs truncate">
                    {tc.outputData ? tc.outputData.replace(/\n/g, " ↵ ") : "(rỗng)"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(tc.id)}
                      className="h-7 w-7 text-neutral-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-xs text-neutral-500">
                  Chưa có test case nào cho bài tập này. Hãy nhấn "Thêm Test Case" để khởi tạo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
