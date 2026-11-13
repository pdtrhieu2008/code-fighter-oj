"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Plus,
  Save,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

export interface EnrollmentRow {
  id: string;
  status: string;
  enrolledAt: string;
  completedAt: string | null;
  email: string;
  fullName: string | null;
  username: string | null;
  fighterId: string | null;
}

export interface ClassRow {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  maxStudents: number | null;
  createdAt: string;
  course: { id: string; title: string } | null;
  instructor: { fullName: string | null; username: string | null } | null;
  enrollments: EnrollmentRow[];
}

export interface CourseOption {
  id: string;
  title: string;
  slug: string;
  status: string;
  level: string;
}

export interface InstructorOption {
  id: string;
  email: string;
  fullName: string | null;
  username: string | null;
}

const ENROLLMENT_STATUSES = ["ACTIVE", "COMPLETED", "DROPPED"];

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-950 text-emerald-400 border border-emerald-900",
  COMPLETED: "bg-blue-950 text-blue-400 border border-blue-900",
  DROPPED: "bg-red-950 text-red-400 border border-red-900",
};

export function AcademyManager({
  classes,
  courses,
  instructors,
}: {
  classes: ClassRow[];
  courses: CourseOption[];
  instructors: InstructorOption[];
}) {
  const router = useRouter();
  const [classList, setClassList] = useState(classes);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [enrollInput, setEnrollInput] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    courseId: "",
    instructorId: "",
    startDate: "",
    endDate: "",
    maxStudents: "",
  });

  const setField = (field: string, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const filtered = useMemo(
    () =>
      classList.filter((cls) =>
        `${cls.name} ${cls.course?.title ?? ""} ${cls.instructor?.username ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [classList, query]
  );

  const showSuccess = (message: string) => {
    setSuccess(message);
    setError("");
  };

  const showError = (message: string) => {
    setError(message);
    setSuccess("");
  };

  const createClass = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy("create");
    setError("");
    setSuccess("");
    try {
      const payload = {
        name: form.name,
        ...(form.description ? { description: form.description } : {}),
        ...(form.courseId ? { courseId: form.courseId } : {}),
        ...(form.instructorId ? { instructorId: form.instructorId } : {}),
        ...(form.startDate ? { startDate: new Date(form.startDate).toISOString() } : {}),
        ...(form.endDate ? { endDate: new Date(form.endDate).toISOString() } : {}),
        ...(form.maxStudents ? { maxStudents: Number(form.maxStudents) } : {}),
      };
      const response = await fetch("/api/admin/academy/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không tạo được lớp học.");
      showSuccess(data.message || "Tạo lớp học thành công!");
      setForm({ name: "", description: "", courseId: "", instructorId: "", startDate: "", endDate: "", maxStudents: "" });
      router.refresh();
      setTimeout(() => window.location.reload(), 300);
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : "Lỗi kết nối.");
    } finally {
      setBusy("");
    }
  };

  const deleteClass = async (classId: string, className: string) => {
    if (!window.confirm(`Xóa lớp "${className}"? Tất cả bản ghi danh trong lớp sẽ bị xóa theo.`)) return;
    setBusy(classId);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/admin/academy/classes/${classId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không xóa được lớp học.");
      setClassList((rows) => rows.filter((row) => row.id !== classId));
      showSuccess(data.message || "Đã xóa lớp.");
      router.refresh();
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : "Lỗi kết nối.");
    } finally {
      setBusy("");
    }
  };

  const enrollStudent = async (classId: string) => {
    const identifier = enrollInput.trim();
    if (!identifier) {
      showError("Nhập email hoặc tên võ sĩ (@username) trước khi ghi danh.");
      return;
    }
    setBusy(`enroll-${classId}`);
    setError("");
    setSuccess("");
    try {
      const payload = identifier.includes("@") && identifier.includes(".")
        ? { email: identifier.toLowerCase() }
        : { username: identifier.replace(/^@/, "") };
      const response = await fetch(`/api/admin/academy/classes/${classId}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không ghi danh được học viên.");
      showSuccess(data.message || "Đã ghi danh học viên.");
      setEnrollInput("");
      router.refresh();
      setTimeout(() => window.location.reload(), 300);
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : "Lỗi kết nối.");
    } finally {
      setBusy("");
    }
  };

  const updateEnrollmentStatus = async (classId: string, enrollmentId: string, status: string) => {
    setBusy(`enrollment-${enrollmentId}`);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/admin/academy/classes/${classId}/enrollments/${enrollmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không cập nhật được trạng thái.");
      setClassList((rows) =>
        rows.map((row) =>
          row.id === classId
            ? {
                ...row,
                enrollments: row.enrollments.map((en) =>
                  en.id === enrollmentId ? { ...en, status, completedAt: data.enrollment?.completedAt ?? en.completedAt } : en
                ),
              }
            : row
        )
      );
      showSuccess(`Đã đổi trạng thái sang ${status}.`);
      router.refresh();
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : "Lỗi kết nối.");
    } finally {
      setBusy("");
    }
  };

  const removeEnrollment = async (classId: string, enrollmentId: string) => {
    if (!window.confirm("Xóa bản ghi danh này khỏi lớp?")) return;
    setBusy(`enrollment-${enrollmentId}`);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/admin/academy/classes/${classId}/enrollments/${enrollmentId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không xóa được bản ghi danh.");
      setClassList((rows) =>
        rows.map((row) =>
          row.id === classId
            ? { ...row, enrollments: row.enrollments.filter((en) => en.id !== enrollmentId) }
            : row
        )
      );
      showSuccess(data.message || "Đã xóa bản ghi danh.");
      router.refresh();
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : "Lỗi kết nối.");
    } finally {
      setBusy("");
    }
  };

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("vi-VN") : "—";

  return (
    <div className="space-y-7">
      <header className="flex items-center gap-3 border-b border-neutral-800 pb-5">
        <GraduationCap className="h-6 w-6 text-emerald-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Học Viện &amp; Lớp Học</h1>
          <p className="mt-1 text-xs text-neutral-400">
            Tạo lớp, gắn khóa học và quản lý ghi danh học viên. Đai của học viên chỉ hiển thị khi ghi danh ACTIVE/COMPLETED vào lớp có khóa học.
          </p>
        </div>
      </header>

      {(error || success) && (
        <p
          role="status"
          className={`border px-3 py-2 text-sm ${error ? "border-red-900 text-red-300" : "border-emerald-900 text-emerald-300"}`}
        >
          {error || success}
        </p>
      )}

      {/* Create class form */}
      <section className="border border-neutral-800 bg-[#16181D] p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Plus className="h-4 w-4 text-red-400" /> Tạo lớp học mới
        </h2>
        <form onSubmit={createClass} className="grid gap-3 md:grid-cols-2">
          <Input
            required
            minLength={3}
            maxLength={100}
            placeholder="Tên lớp (vd: Lớp C++ Nâng Cao K25)"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            className="border-neutral-700 bg-neutral-900"
          />
          <Input
            placeholder="Mô tả ngắn về lớp (không bắt buộc)"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            className="border-neutral-700 bg-neutral-900"
          />
          <label className="text-xs text-neutral-400">
            Khóa học (bắt buộc để học viên có đai hiển thị)
            <select
              value={form.courseId}
              onChange={(e) => setField("courseId", e.target.value)}
              className="mt-1 block w-full border border-neutral-700 bg-neutral-900 p-2 text-white"
            >
              <option value="">— Lớp rời (không gắn khóa) —</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.slug}) · {course.status}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-400">
            Huấn luyện viên phụ trách
            <select
              value={form.instructorId}
              onChange={(e) => setField("instructorId", e.target.value)}
              className="mt-1 block w-full border border-neutral-700 bg-neutral-900 p-2 text-white"
            >
              <option value="">— Chưa phân công —</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.fullName ?? instructor.username ?? instructor.email}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-400">
            Ngày bắt đầu
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setField("startDate", e.target.value)}
              className="mt-1 block w-full border border-neutral-700 bg-neutral-900 p-2 text-white"
            />
          </label>
          <label className="text-xs text-neutral-400">
            Ngày kết thúc
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setField("endDate", e.target.value)}
              className="mt-1 block w-full border border-neutral-700 bg-neutral-900 p-2 text-white"
            />
          </label>
          <label className="text-xs text-neutral-400">
            Số học viên tối đa
            <input
              type="number"
              min={1}
              max={1000}
              placeholder="Không giới hạn nếu để trống"
              value={form.maxStudents}
              onChange={(e) => setField("maxStudents", e.target.value)}
              className="mt-1 block w-full border border-neutral-700 bg-neutral-900 p-2 text-white"
            />
          </label>
          <div className="flex items-end">
            <Button type="submit" disabled={busy === "create"} className="gap-2">
              <Save className="h-4 w-4" />
              {busy === "create" ? "Đang tạo..." : "Tạo lớp học"}
            </Button>
          </div>
        </form>
      </section>

      {/* Class list */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Users className="h-4 w-4 text-cyan-400" /> Danh sách lớp ({filtered.length})
          </h2>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm lớp theo tên, khóa học, HLV..."
              className="border-neutral-700 bg-[#16181D] pl-9"
            />
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="rounded-xl border border-neutral-800 bg-[#16181D] p-8 text-center text-xs text-neutral-500">
            Chưa có lớp học nào. Tạo lớp đầu tiên ở khung trên.
          </div>
        )}

        {filtered.map((cls) => {
          const isExpanded = expandedId === cls.id;
          const activeCount = cls.enrollments.filter((en) => en.status === "ACTIVE").length;
          return (
            <div key={cls.id} className="rounded-xl border border-neutral-800 bg-[#16181D] overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : cls.id)}
                  className="flex items-center gap-3 text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-neutral-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-neutral-400" />
                  )}
                  <div>
                    <div className="text-sm font-semibold text-white">{cls.name}</div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-neutral-400">
                      <span>
                        Khóa: {cls.course?.title ?? <span className="italic text-neutral-600">lớp rời</span>}
                      </span>
                      <span>
                        HLV: {cls.instructor?.username ?? <span className="italic text-neutral-600">chưa phân công</span>}
                      </span>
                      <span>
                        {formatDate(cls.startDate)} → {formatDate(cls.endDate)}
                      </span>
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-neutral-800 text-neutral-200 border border-neutral-700">
                    {activeCount}/{cls.maxStudents ?? "∞"} ACTIVE
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteClass(cls.id, cls.name)}
                    disabled={busy === cls.id}
                    className="gap-1.5 border-red-900/60 text-red-400 hover:bg-red-950/40 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Xóa lớp
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-neutral-800 bg-neutral-900/40 p-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Input
                      value={enrollInput}
                      onChange={(e) => setEnrollInput(e.target.value)}
                      placeholder="Email hoặc @username của học viên..."
                      className="max-w-xs border-neutral-700 bg-neutral-900"
                    />
                    <Button
                      size="sm"
                      onClick={() => enrollStudent(cls.id)}
                      disabled={busy === `enroll-${cls.id}`}
                      className="gap-1.5 text-xs"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      {busy === `enroll-${cls.id}` ? "Đang ghi danh..." : "Ghi danh"}
                    </Button>
                  </div>

                  {cls.enrollments.length === 0 ? (
                    <p className="text-xs text-neutral-500 py-4 text-center">
                      Lớp chưa có học viên nào. Ghi danh bằng email hoặc @username ở trên.
                    </p>
                  ) : (
                    <div className="overflow-x-auto border border-neutral-800 rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-neutral-800">
                            <TableHead>Học Viên</TableHead>
                            <TableHead>Fighter ID</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="w-32">Trạng Thái</TableHead>
                            <TableHead className="w-28 text-right">Ghi Danh</TableHead>
                            <TableHead className="w-20 text-right">Thao Tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cls.enrollments.map((en) => (
                            <TableRow key={en.id} className="border-neutral-800">
                              <TableCell className="text-xs text-white">
                                {en.fullName ?? "—"}
                                <div className="font-mono text-[10px] text-neutral-500">
                                  @{en.username ?? "—"}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs text-neutral-400">
                                {en.fighterId ?? "—"}
                              </TableCell>
                              <TableCell className="text-xs text-neutral-400">{en.email}</TableCell>
                              <TableCell>
                                <select
                                  aria-label={`Đổi trạng thái ${en.username ?? en.email}`}
                                  disabled={busy === `enrollment-${en.id}`}
                                  value={en.status}
                                  onChange={(e) => updateEnrollmentStatus(cls.id, en.id, e.target.value)}
                                  className="w-full border border-neutral-700 bg-neutral-900 p-1.5 text-xs text-white"
                                >
                                  {ENROLLMENT_STATUSES.map((status) => (
                                    <option key={status}>{status}</option>
                                  ))}
                                </select>
                                <div className="mt-1">
                                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${STATUS_BADGE[en.status] ?? ""}`}>
                                    {en.status}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs text-neutral-500">
                                {formatDate(en.enrolledAt)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeEnrollment(cls.id, en.id)}
                                  disabled={busy === `enrollment-${en.id}`}
                                  className="gap-1 border-neutral-700 text-neutral-400 hover:text-red-400 text-xs"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
