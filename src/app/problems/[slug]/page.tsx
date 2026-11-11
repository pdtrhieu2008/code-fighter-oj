import React from "react";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Clock, HardDrive, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProblemSolver } from "./ProblemSolver";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProblemDetailPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();

  const problem = await prisma.problem.findUnique({
    where: { slug },
    include: {
      tags: {
        include: { tag: true },
      },
      testCases: {
        where: { isSample: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!problem || problem.deletedAt) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#101114]">
      <Navbar
        user={
          session?.user
            ? {
                username: session.user.name ?? undefined,
                fighterId: session.user.email ?? undefined,
                role: "REGISTERED_USER",
              }
            : null
        }
      />

      <main className="flex-1 flex flex-col">
        {/* Top Breadcrumb & Quick Info Bar */}
        <div className="border-b border-neutral-800 bg-[#14161C] px-4 py-2.5 sm:px-6">
          <div className="container mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Link href="/problems">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-neutral-400">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Danh Sách
                </Button>
              </Link>
              <span className="text-neutral-600 font-mono">/</span>
              <span className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-md">
                {problem.title}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-neutral-400">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-neutral-500" />
                {problem.timeLimit} ms
              </span>
              <span className="flex items-center gap-1">
                <HardDrive className="h-3.5 w-3.5 text-neutral-500" />
                {Math.round(problem.memoryLimit / 1024)} MB
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Split Solving Workspace */}
        <div className="flex-1 container mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <ProblemSolver
            problem={{
              id: problem.id,
              slug: problem.slug,
              title: problem.title,
              statement: problem.statement,
              inputFormat: problem.inputFormat,
              outputFormat: problem.outputFormat,
              constraints: problem.constraints,
              difficulty: problem.difficulty,
              tags: problem.tags,
              testCases: problem.testCases.map((testCase) => ({
                id: testCase.id,
                inputData: testCase.inputData,
                outputData: testCase.outputData,
              })),
            }}
            isLoggedIn={!!session?.user}
            userId={session?.user?.id ?? null}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
