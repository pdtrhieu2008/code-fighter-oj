import React from "react";
import { prisma } from "@/lib/prisma";
import { BeltBadge } from "@/components/belt/BeltBadge";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Award, CheckCircle, Shield, GraduationCap } from "lucide-react";
import { getBeltInfo, BELT_ORDER } from "@/lib/belt-utils";

export default async function AdminBeltsPage() {
  const requirements = await prisma.beltRequirement.findMany({
    orderBy: [{ beltColor: "asc" }, { beltLevel: "asc" }],
  });

  // Sort requirements by canonical belt order
  const sorted = [...requirements].sort((a, b) => {
    const aOrder = BELT_ORDER.indexOf(a.beltColor);
    const bOrder = BELT_ORDER.indexOf(b.beltColor);
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.beltLevel.localeCompare(b.beltLevel);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
            Cấu Hình Hệ Thống 9 Bậc Đai & 27 Cấp Độ
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Quy chuẩn điều kiện thăng cấp võ sĩ: EXP tối thiểu, chỉ tiêu số bài giải và kỳ thi chuẩn hóa.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-[#16181D] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-800">
              <TableHead className="w-16 font-mono text-center">STT</TableHead>
              <TableHead className="w-44">Cấp Bậc Đai</TableHead>
              <TableHead className="w-28 text-right">EXP Tối Thiểu</TableHead>
              <TableHead className="w-28 text-right">Tổng Bài Giải</TableHead>
              <TableHead className="w-32 text-center">Chỉ Tiêu (Dễ/TB/Khó)</TableHead>
              <TableHead className="w-36 text-center">Kỳ Thi Thăng Đai</TableHead>
              <TableHead className="text-right">Trạng Thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((req, idx) => {
              const info = getBeltInfo(req.beltColor, req.beltLevel);
              return (
                <TableRow key={req.id} className="border-neutral-800">
                  <TableCell className="font-mono text-xs text-neutral-500 text-center">
                    {idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <BeltBadge color={req.beltColor} level={req.beltLevel} size="sm" />
                      <div>
                        <div className="font-semibold text-white text-xs">{info.displayName}</div>
                        <div className="text-[10px] font-mono text-neutral-500 uppercase">
                          {req.beltLevel}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-white">
                    {req.minExp.toLocaleString()} EXP
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-neutral-300">
                    &ge; {req.minSolvedProblems} bài
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-neutral-400">
                    {req.minEasyProblems} / {req.minMediumProblems} / {req.minHardProblems}
                  </TableCell>
                  <TableCell className="text-center">
                    {req.requiresExamination ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900/60">
                        <GraduationCap className="h-3 w-3" /> Bắt Buộc Thi
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-neutral-500">
                        Tự động xét duyệt
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-900/60">
                      Hiệu Lực
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
