import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CODE FIGHTER OJ — Train Like a Fighter. Code Like a Champion.",
  description:
    "Hệ thống Lập trình Thi đấu (Online Judge), Quản lý Học viện & Luyện thi Chuyên Tin, THPTQG Tin học chuẩn Spartan.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#101114] text-neutral-100 font-sans selection:bg-red-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
