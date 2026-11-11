import React from "react";
import { prisma } from "@/lib/prisma";
import { ProblemForm } from "../ProblemForm";

export default async function CreateProblemPage() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
          Soạn Bài Tập Mới
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Khởi tạo thử thách mới vào kho tàng bài tập trung tâm (Central Problem Repository).
        </p>
      </div>

      <ProblemForm tags={tags} />
    </div>
  );
}
