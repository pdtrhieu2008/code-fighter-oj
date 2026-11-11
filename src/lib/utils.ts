import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names with conflict resolution.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Fighter ID ───────────────────────────────────────────────

/**
 * Format a numeric user ID as a CF Fighter ID string.
 * @example formatFighterId(42) → "CF-000042"
 */
export function formatFighterId(id: number): string {
  return `CF-${String(id).padStart(6, "0")}`;
}

// ─── EXP / numbers ────────────────────────────────────────────

/**
 * Human-readable EXP value with K/M suffixes.
 */
export function formatEXP(exp: number): string {
  if (exp >= 1_000_000) return `${(exp / 1_000_000).toFixed(1)}M`;
  if (exp >= 1_000)     return `${(exp / 1_000).toFixed(1)}K`;
  return String(exp);
}

/**
 * Compute acceptance rate as a percentage string.
 */
export function getAcceptanceRate(accepted: number, total: number): string {
  if (total === 0) return "0%";
  return `${((accepted / total) * 100).toFixed(1)}%`;
}

// ─── Dates ────────────────────────────────────────────────────

/**
 * Format a date in Vietnamese medium format.
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(
    new Date(date)
  );
}

/**
 * Relative time string in Vietnamese (e.g. "5 phút trước").
 */
export function formatRelativeTime(date: Date | string): string {
  const now    = new Date();
  const target = new Date(date);
  const diffMs   = now.getTime() - target.getTime();
  const diffSecs = Math.floor(diffMs / 1_000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours= Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs  <  60) return "vừa xong";
  if (diffMins  <  60) return `${diffMins} phút trước`;
  if (diffHours <  24) return `${diffHours} giờ trước`;
  if (diffDays  <  30) return `${diffDays} ngày trước`;
  return formatDate(date);
}

/**
 * Format a duration in seconds as mm:ss or hh:mm:ss.
 */
export function formatDuration(seconds: number): string {
  const h  = Math.floor(seconds / 3600);
  const m  = Math.floor((seconds % 3600) / 60);
  const s  = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

// ─── Verdict helpers ──────────────────────────────────────────

export type Verdict =
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TIME_LIMIT_EXCEEDED"
  | "MEMORY_LIMIT_EXCEEDED"
  | "RUNTIME_ERROR"
  | "COMPILE_ERROR"
  | "PENDING"
  | "JUDGING";

export const VERDICT_LABELS: Record<Verdict, string> = {
  ACCEPTED:              "Accepted",
  WRONG_ANSWER:          "Wrong Answer",
  TIME_LIMIT_EXCEEDED:   "Time Limit Exceeded",
  MEMORY_LIMIT_EXCEEDED: "Memory Limit Exceeded",
  RUNTIME_ERROR:         "Runtime Error",
  COMPILE_ERROR:         "Compile Error",
  PENDING:               "Pending",
  JUDGING:               "Judging…",
};

export const VERDICT_SHORT: Record<Verdict, string> = {
  ACCEPTED:              "AC",
  WRONG_ANSWER:          "WA",
  TIME_LIMIT_EXCEEDED:   "TLE",
  MEMORY_LIMIT_EXCEEDED: "MLE",
  RUNTIME_ERROR:         "RE",
  COMPILE_ERROR:         "CE",
  PENDING:               "--",
  JUDGING:               "...",
};

export function getVerdictColor(verdict: Verdict): string {
  switch (verdict) {
    case "ACCEPTED":              return "text-brand-green";
    case "WRONG_ANSWER":          return "text-fighter-red";
    case "TIME_LIMIT_EXCEEDED":   return "text-brand-yellow";
    case "MEMORY_LIMIT_EXCEEDED": return "text-orange-500";
    case "RUNTIME_ERROR":         return "text-purple-500";
    case "COMPILE_ERROR":         return "text-gray-400";
    default:                      return "text-muted-fg";
  }
}

// ─── Difficulty helpers ───────────────────────────────────────

export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "EXPERT";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY:   "Dễ",
  MEDIUM: "Trung bình",
  HARD:   "Khó",
  EXPERT: "Chuyên gia",
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  EASY:   "text-brand-green",
  MEDIUM: "text-brand-yellow",
  HARD:   "text-fighter-red",
  EXPERT: "text-purple-500",
};

export const DIFFICULTY_BG: Record<Difficulty, string> = {
  EASY:   "bg-brand-green/10 text-brand-green",
  MEDIUM: "bg-brand-yellow/10 text-brand-yellow",
  HARD:   "bg-fighter-red/10 text-fighter-red",
  EXPERT: "bg-purple-500/10 text-purple-500",
};

// ─── Misc ─────────────────────────────────────────────────────

/**
 * Clamp a value between min and max (inclusive).
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate percentage, clamped to [0, 100].
 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return clamp((value / total) * 100, 0, 100);
}

/**
 * Truncate a string to a max length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "…";
}

/**
 * Generate initials from a full name (up to 2 chars).
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
