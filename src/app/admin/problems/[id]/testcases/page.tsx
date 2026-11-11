import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TestCaseManager } from "./TestCaseManager";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProblemTestCasesPage({ params }: Props) {
  const { id } = await params;

  const problem = await prisma.problem.findUnique({
    where: { id },
    include: {
      testCases: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!problem || problem.deletedAt) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
          Quản Lý Bộ Test: {problem.title}
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Mã bài: <span className="font-mono text-white">{problem.slug}</span> &bull; Quản lý dữ liệu test công khai và test ẩn cho máy chấm tự động.
        </p>
      </div>

      <TestCaseManager problem={problem} initialTestCases={problem.testCases} />
    </div>
  );
}
