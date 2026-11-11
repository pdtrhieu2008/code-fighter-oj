import React from "react";
import { BeltColor, BeltLevel, getBeltInfo, getNextBelt } from "@/lib/belt-utils";
import { BeltBadge } from "./BeltBadge";
import { formatEXP } from "@/lib/utils";

export interface BeltProgressBarProps {
  currentColor: BeltColor;
  currentLevel: BeltLevel;
  currentExp: number;
  requiredExp: number;
  className?: string;
}

export function BeltProgressBar({
  currentColor,
  currentLevel,
  currentExp,
  requiredExp,
  className,
}: BeltProgressBarProps) {
  const currentBelt = getBeltInfo(currentColor, currentLevel);
  const nextBelt = getNextBelt(currentColor, currentLevel);
  const nextBeltInfo = nextBelt ? getBeltInfo(nextBelt.color, nextBelt.level) : null;

  const percentage = Math.min(
    100,
    Math.max(0, requiredExp > 0 ? Math.round((currentExp / requiredExp) * 100) : 100)
  );

  return (
    <div className={`rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 ${className ?? ""}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <BeltBadge color={currentColor} level={currentLevel} size="sm" />
          <div>
            <div className="text-xs font-semibold text-neutral-300">
              Tiến Độ Thăng Đai: <span className="text-white">{currentBelt.displayName}</span>
            </div>
            <div className="text-[11px] font-mono text-neutral-400">
              {formatEXP(currentExp)} / {requiredExp > 0 ? formatEXP(requiredExp) : "MAX"} EXP ({percentage}%)
            </div>
          </div>
        </div>

        {nextBelt && nextBeltInfo && (
          <div className="flex items-center gap-2 text-right">
            <div className="hidden sm:block">
              <div className="text-[10px] uppercase text-neutral-500 font-mono">Đai Tiếp Theo</div>
              <div className="text-xs font-medium text-neutral-300">{nextBeltInfo.displayName}</div>
            </div>
            <BeltBadge color={nextBelt.color} level={nextBelt.level} size="sm" />
          </div>
        )}
      </div>

      {/* Progress Track */}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: currentBelt.colorHex,
            boxShadow: `0 0 10px ${currentBelt.accentHex}88`,
          }}
        />
      </div>
    </div>
  );
}
