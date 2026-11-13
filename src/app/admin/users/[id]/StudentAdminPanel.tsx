"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Award } from "lucide-react";
import { BELT_COLORS, BELT_ORDER, BELT_LEVEL_LABELS, type BeltColor, type BeltLevel } from "@/lib/belt-utils";

const LEVELS: BeltLevel[] = ["LEVEL_I", "LEVEL_II", "LEVEL_III"];

export interface StudentProfileFields {
  fullName: string;
  bio: string;
  location: string;
  website: string;
  githubHandle: string;
  twitterHandle: string;
}

export interface CurrentBelt {
  beltColor: BeltColor;
  beltLevel: BeltLevel;
  awardedAt: string;
}

export function StudentAdminPanel({
  userId,
  initialProfile,
  currentBelt,
}: {
  userId: string;
  initialProfile: StudentProfileFields;
  currentBelt: CurrentBelt | null;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfileFields>(initialProfile);
  const [busy, setBusy] = useState<"" | "profile" | "belt">("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [beltColor, setBeltColor] = useState<BeltColor>(currentBelt?.beltColor ?? "WHITE");
  const [beltLevel, setBeltLevel] = useState<BeltLevel>(currentBelt?.beltLevel ?? "LEVEL_I");
  const [reason, setReason] = useState("");

  const setField = (field: keyof StudentProfileFields, value: string) =>
    setProfile((current) => ({ ...current, [field]: value }));

  const showSuccess = (message: string) => {
    setSuccess(message);
    setError("");
  };
  const showError = (message: string) => {
    setError(message);
    setSuccess("");
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy("profile");
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không cập nhật được hồ sơ.");
      showSuccess(data.message || "Đã cập nhật hồ sơ học viên.");
      router.refresh();
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : "Lỗi kết nối.");
    } finally {
      setBusy("");
    }
  };

  const awardBelt = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (reason.trim().length < 3) {
      showError("Nhập lý do cấp đai (tối thiểu 3 ký tự) để lưu vào lịch sử.");
      return;
    }
    const label = `${BELT_COLORS[beltColor].name} · ${BELT_LEVEL_LABELS[beltLevel]}`;
    if (!window.confirm(`Cấp ${label} cho học viên này? Lịch sử đai cũ vẫn được giữ nguyên.`)) return;

    setBusy("belt");
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/admin/users/${userId}/belt`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beltColor, beltLevel, reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không cấp được đai.");
      showSuccess(data.message || "Đã ghi nhận cấp đai mới.");
      setReason("");
      router.refresh();
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : "Lỗi kết nối.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-6">
      {(error || success) && (
        <div
          className={`border p-3 text-xs ${
            error
              ? "border-red-900 bg-red-950/40 text-red-300"
              : "border-emerald-900 bg-emerald-950/40 text-emerald-300"
          }`}
        >
          {error || success}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="border border-neutral-800 bg-[#16181D] p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Chỉnh sửa hồ sơ học viên</h2>
          <form onSubmit={saveProfile} className="space-y-3">
            <label className="block text-xs text-neutral-400">
              Họ và tên
              <Input
                value={profile.fullName}
                onChange={(e) => setField("fullName", e.target.value)}
                maxLength={120}
                placeholder="Nguyễn Văn A"
                className="mt-1 border-neutral-700 bg-neutral-900"
              />
            </label>
            <label className="block text-xs text-neutral-400">
              Giới thiệu
              <textarea
                value={profile.bio}
                onChange={(e) => setField("bio", e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Mục tiêu học tập, kinh nghiệm..."
                className="mt-1 block w-full border border-neutral-700 bg-neutral-900 p-2 text-sm text-white"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs text-neutral-400">
                Vị trí
                <Input
                  value={profile.location}
                  onChange={(e) => setField("location", e.target.value)}
                  maxLength={120}
                  placeholder="Hà Nội"
                  className="mt-1 border-neutral-700 bg-neutral-900"
                />
              </label>
              <label className="block text-xs text-neutral-400">
                Website
                <Input
                  value={profile.website}
                  onChange={(e) => setField("website", e.target.value)}
                  maxLength={200}
                  placeholder="https://..."
                  className="mt-1 border-neutral-700 bg-neutral-900"
                />
              </label>
              <label className="block text-xs text-neutral-400">
                GitHub
                <Input
                  value={profile.githubHandle}
                  onChange={(e) => setField("githubHandle", e.target.value)}
                  maxLength={80}
                  placeholder="username"
                  className="mt-1 border-neutral-700 bg-neutral-900"
                />
              </label>
              <label className="block text-xs text-neutral-400">
                Twitter / X
                <Input
                  value={profile.twitterHandle}
                  onChange={(e) => setField("twitterHandle", e.target.value)}
                  maxLength={80}
                  placeholder="handle"
                  className="mt-1 border-neutral-700 bg-neutral-900"
                />
              </label>
            </div>
            <p className="text-[11px] text-neutral-500">
              Không thể đổi email, mật khẩu, EXP hay rating tại đây.
            </p>
            <Button type="submit" size="sm" disabled={busy === "profile"} className="gap-1.5 text-xs">
              <Save className="h-3.5 w-3.5" />
              {busy === "profile" ? "Đang lưu..." : "Lưu hồ sơ"}
            </Button>
          </form>
        </section>

        <section className="border border-neutral-800 bg-[#16181D] p-5">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
            <Award className="h-4 w-4 text-amber-400" /> Cấp đai cho học viên
          </h2>
          <p className="mb-4 text-[11px] text-neutral-500">
            Đai hiện tại:{" "}
            {currentBelt
              ? `${BELT_COLORS[currentBelt.beltColor].name} · ${BELT_LEVEL_LABELS[currentBelt.beltLevel]}`
              : "chưa có"}
          </p>
          <form onSubmit={awardBelt} className="space-y-3">
            <label className="block text-xs text-neutral-400">
              Màu đai
              <select
                value={beltColor}
                onChange={(e) => setBeltColor(e.target.value as BeltColor)}
                className="mt-1 block w-full border border-neutral-700 bg-neutral-900 p-2 text-sm text-white"
              >
                {BELT_ORDER.map((color) => (
                  <option key={color} value={color}>
                    {BELT_COLORS[color].name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-neutral-400">
              Cấp độ
              <select
                value={beltLevel}
                onChange={(e) => setBeltLevel(e.target.value as BeltLevel)}
                className="mt-1 block w-full border border-neutral-700 bg-neutral-900 p-2 text-sm text-white"
              >
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {BELT_LEVEL_LABELS[level]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-neutral-400">
              Lý do / ghi chú
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="VD: Hoàn thành lớp C++ K25, đạt chứng chỉ..."
                className="mt-1 block w-full border border-neutral-700 bg-neutral-900 p-2 text-sm text-white"
              />
            </label>
            <Button type="submit" size="sm" disabled={busy === "belt"} className="gap-1.5 text-xs">
              <Award className="h-3.5 w-3.5" />
              {busy === "belt" ? "Đang cấp..." : "Cấp đai"}
            </Button>
            <p className="text-[11px] text-neutral-500">
              Mỗi lần cấp là một bản ghi mới; lịch sử đai trước đó không bị xóa.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
