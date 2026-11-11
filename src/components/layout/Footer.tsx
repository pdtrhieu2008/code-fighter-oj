import React from "react";
import Link from "next/link";
import { Shield, Terminal, Award, BookOpen, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-[#0E0F12] text-neutral-400">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E63946] shadow-sm">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="font-mono text-base font-extrabold tracking-wider text-white">
                CODE<span className="text-[#E63946]">FIGHTER</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Nền tảng Luyện thi Chuyên Tin, Lập trình Thi đấu (Competitive Programming) & THPTQG Tin học.
            </p>
            <div className="text-[11px] font-mono text-neutral-500 font-semibold tracking-wider">
              TRAIN LIKE A FIGHTER. CODE LIKE A CHAMPION.
            </div>
          </div>

          {/* Sân Đấu */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-200 mb-3">
              Võ Đài Luyện Tập
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/problems" className="hover:text-white transition-colors">
                  Thư Viện Bài Tập
                </Link>
              </li>
              <li>
                <Link href="/contests" className="hover:text-white transition-colors">
                  Giải Đấu Trực Tuyến
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="hover:text-white transition-colors">
                  Bảng Phong Thần
                </Link>
              </li>
              <li>
                <Link href="/belts" className="hover:text-white transition-colors">
                  Hệ Thống 9 Bậc Đai
                </Link>
              </li>
            </ul>
          </div>

          {/* Học Viện */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-200 mb-3">
              Học Viện Code Fighter
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/academy/cpp" className="hover:text-white transition-colors">
                  Khóa C++ Nền Tảng & Chuyên Sâu
                </Link>
              </li>
              <li>
                <Link href="/academy/algorithms" className="hover:text-white transition-colors">
                  Cấu Trúc Dữ Liệu & Giải Thuật
                </Link>
              </li>
              <li>
                <Link href="/academy/thptqg" className="hover:text-white transition-colors">
                  Luyện Thi THPTQG Môn Tin Học
                </Link>
              </li>
              <li>
                <Link href="/examinations" className="hover:text-white transition-colors">
                  Kỳ Thi Thăng Đai Chính Thức
                </Link>
              </li>
            </ul>
          </div>

          {/* Pháp Lý & Quy Chuẩn */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-200 mb-3">
              Quy Chuẩn & Bảo Mật
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/rules" className="hover:text-white transition-colors">
                  Văn Hóa & Kỷ Luật Võ Sĩ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Điều Khoản Nền Tảng
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Chính Sách Bảo Mật
                </Link>
              </li>
              <li>
                <span className="text-neutral-500 font-mono text-[11px]">
                  Judge Engine: Sandbox v2.4 (Cgroups v2)
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-neutral-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500">
          <div>
            &copy; {new Date().getFullYear()} CODE FIGHTER OJ. Mọi quyền được bảo lưu.
          </div>
          <div className="flex items-center gap-1 mt-2 sm:mt-0 font-mono text-[11px]">
            <span>Được rèn đúc bằng Kỷ Luật & Trí Tuệ</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
