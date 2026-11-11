"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Code2,
  PlusCircle,
  Users,
  Award,
  UsersRound,
  Swords,
  GraduationCap,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Tổng Quan", icon: LayoutDashboard },
  { href: "/admin/problems", label: "Quản Lý Bài Tập", icon: Code2 },
  { href: "/admin/problems/create", label: "Soạn Bài Tập Mới", icon: PlusCircle },
  { href: "/admin/users", label: "Người Dùng & Võ Sĩ", icon: Users },
  { href: "/admin/belts", label: "Cấu Hình 27 Cấp Đai", icon: Award },
  { href: "/admin/groups", label: "Học Viện & Lớp Học", icon: UsersRound },
  { href: "/admin/contests", label: "Giải Đấu (Contest)", icon: Swords },
  { href: "/admin/examinations", label: "Kỳ Thi Thăng Đai", icon: GraduationCap },
  { href: "/admin/audit-logs", label: "Nhật Ký Kiểm Toán", icon: FileText },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-neutral-800 bg-[#121418] flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-neutral-800">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E63946] text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="font-mono text-sm font-bold text-white tracking-wider">
              CF <span className="text-[#E63946]">HQ</span>
            </div>
            <div className="text-[10px] font-mono text-neutral-400">
              TRUNG TÂM CHỈ HUY ADMIN
            </div>
          </div>
        </Link>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                isActive
                  ? "bg-red-950/50 text-red-200 border border-red-900/60 font-semibold"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-[#E63946]" : "text-neutral-500")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Back to Portal */}
      <div className="p-3 border-t border-neutral-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại Đấu Trường
        </Link>
      </div>
    </aside>
  );
}
