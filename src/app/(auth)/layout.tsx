import React from "react";
import Link from "next/link";
import { Shield } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#101114] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-red-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-3 group mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#E63946] to-red-800 shadow-lg shadow-red-950/60 transition-transform group-hover:scale-105">
            <Shield className="h-7 w-7 text-white stroke-[2.2]" />
          </div>
          <div className="text-left">
            <span className="font-mono text-xl font-extrabold tracking-wider text-white">
              CODE<span className="text-[#E63946]">FIGHTER</span>
            </span>
            <div className="text-[10px] font-mono tracking-widest text-neutral-400">
              TRAIN LIKE A FIGHTER. CODE LIKE A CHAMPION.
            </div>
          </div>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#16181D] border border-neutral-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
