import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProblemForm } from "../../ProblemForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProblemPage({ params }: Props) {
  const { id } = await params;

  const [problem, tags] = await Promise.all([
    prisma.problem.findUnique({
      where: { id },
      include: {
        tags: true,
      },
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!problem || problem.deletedAt) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
          Chỉnh Sửa Bài Tập: {problem.title}
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Cập nhật thông tin bài toán. Phiên bản hiện tại: v{problem.version}
        </p>
      </div>

      <ProblemForm initialProblem={problem} tags={tags} isEdit={true} />
    </div>
  );
}
