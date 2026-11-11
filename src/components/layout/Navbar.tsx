"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Code2,
  Trophy,
  Swords,
  GraduationCap,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavbarProps {
  user?: {
    username?: string;
    fighterId?: string;
    role?: string;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/problems", label: "Bài Tập", icon: Code2 },
    { href: "/contests", label: "Đấu Trường", icon: Swords },
    { href: "/leaderboard", label: "Bảng Phong Thần", icon: Trophy },
    { href: "/academy", label: "Học Viện", icon: GraduationCap },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-[#101114]/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#E63946] to-red-800 shadow-md shadow-red-950/50 transition-transform group-hover:scale-105">
              <Shield className="h-6 w-6 text-white stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-base font-extrabold tracking-wider text-white">
                CODE<span className="text-[#E63946]">FIGHTER</span>
              </span>
              <span className="text-[9px] font-medium tracking-widest text-neutral-400 font-mono -mt-1">
                ONLINE JUDGE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-neutral-800">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-neutral-800/90 text-white font-semibold"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action / Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2 text-neutral-300">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Button>
              </Link>
              <Link href={`/fighters/${user.username}`}>
                <Button variant="outline" size="sm" className="gap-2 border-neutral-700">
                  <User className="h-4 w-4 text-[#E63946]" />
                  <span className="font-mono text-xs">{user.username}</span>
                </Button>
              </Link>
              <form action="/api/auth/signout" method="POST">
                <Button variant="ghost" size="icon" type="submit" title="Đăng xuất">
                  <LogOut className="h-4 w-4 text-neutral-400 hover:text-red-400" />
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-neutral-300 hover:text-white">
                  Đăng Nhập
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="fighter" size="sm">
                  Gia Nhập Võ Đài
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden border-b border-neutral-800 bg-[#16181D] px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-neutral-300 hover:bg-neutral-800 hover:text-white"
              >
                <Icon className="h-4 w-4 text-[#E63946]" />
                {item.label}
              </Link>
            );
          })}
          <div className="pt-4 border-t border-neutral-800 flex flex-col gap-2">
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                  <Button variant="secondary" className="w-full justify-start gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link href={`/fighters/${user.username}`} onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <User className="h-4 w-4" />
                    Hồ Sơ Võ Sĩ ({user.username})
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link href="/login" className="flex-1" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Đăng Nhập
                  </Button>
                </Link>
                <Link href="/register" className="flex-1" onClick={() => setIsOpen(false)}>
                  <Button variant="fighter" className="w-full">
                    Gia Nhập
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
