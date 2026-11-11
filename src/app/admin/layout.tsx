import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { ShieldAlert } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  const role = (session.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return (
      <div className="min-h-screen bg-[#101114] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#16181D] border border-neutral-800 rounded-xl p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-red-950/60 border border-red-900/60 flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-white">Truy Cập Bị Từ Chối</h1>
          <p className="text-xs text-neutral-400">
            Khu vực này chỉ dành riêng cho Ban Chỉ Huy & Quản Trị Viên của Code Fighter OJ.
          </p>
          <a
            href="/dashboard"
            className="inline-block mt-4 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-mono rounded-lg transition-colors"
          >
            Về Trang Cá Nhân
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101114] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-neutral-800 bg-[#14161C]/80 backdrop-blur px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Hệ thống: <strong className="text-white">HOẠT ĐỘNG</strong>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-neutral-400">
              Quyền: <span className="text-[#E63946] font-bold">{role}</span>
            </span>
            <span className="text-xs font-mono text-white">
              @{(session.user as any)?.username || session.user.email}
            </span>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
