import React from "react";
import {
  BeltColor,
  BeltLevel,
  BELT_COLORS,
  BELT_LEVEL_STRIPES,
  getBeltInfo,
} from "@/lib/belt-utils";
import { cn } from "@/lib/utils";

export interface BeltBadgeProps {
  color: BeltColor;
  level: BeltLevel;
  size?: "sm" | "md" | "lg";
  variant?: "compact" | "detailed";
  showLabel?: boolean;
  className?: string;
}

export function BeltBadge({
  color,
  level,
  size = "md",
  variant = "compact",
  showLabel = false,
  className,
}: BeltBadgeProps) {
  const belt = getBeltInfo(color, level);
  const stripes = BELT_LEVEL_STRIPES[level];

  // Dimensions based on size
  const dimensions = {
    sm: { width: 32, height: 32, icon: 20 },
    md: { width: 44, height: 44, icon: 28 },
    lg: { width: 72, height: 72, icon: 48 },
  }[size];

  const badgeSvg = (
    <svg
      width={dimensions.width}
      height={dimensions.height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-transform duration-200 hover:scale-105 select-none"
      role="img"
      aria-label={`${belt.displayName}`}
    >
      <defs>
        {/* Shadow filter */}
        <filter id={`shadow-${color}-${level}`} x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.4" />
        </filter>

        {/* Gradient for metallic / martial feel */}
        <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={belt.colorHex} stopOpacity="1" />
          <stop offset="100%" stopColor={belt.accentHex} stopOpacity="0.95" />
        </linearGradient>

        <linearGradient id="goldStripe" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
      </defs>

      {/* Outer Hexagon / Shield Frame */}
      <path
        d="M50 4 L90 26 L90 74 L50 96 L10 74 L10 26 Z"
        fill="#121316"
        stroke={color === "BLACK" ? "#F59E0B" : belt.accentHex}
        strokeWidth="3.5"
        strokeLinejoin="round"
        filter={`url(#shadow-${color}-${level})`}
      />

      {/* Main Belt Body (Insignia Core) */}
      <path
        d="M50 11 L83 29 L83 71 L50 89 L17 71 L17 29 Z"
        fill={`url(#grad-${color})`}
        stroke="#1E2024"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Central Spartan Knot / Martial Knot */}
      <path
        d="M34 40 L66 40 L50 60 Z"
        fill="#101114"
        opacity="0.25"
      />

      {/* Level Stripe Marks */}
      {stripes >= 1 && (
        <rect
          x={stripes === 1 ? "44" : stripes === 2 ? "38" : "32"}
          y="68"
          width="12"
          height="7"
          rx="1.5"
          fill={color === "BLACK" ? "url(#goldStripe)" : "#FFFFFF"}
          stroke="#101114"
          strokeWidth="1"
        />
      )}
      {stripes >= 2 && (
        <rect
          x={stripes === 2 ? "52" : "44"}
          y="68"
          width="12"
          height="7"
          rx="1.5"
          fill={color === "BLACK" ? "url(#goldStripe)" : "#FFFFFF"}
          stroke="#101114"
          strokeWidth="1"
        />
      )}
      {stripes === 3 && (
        <rect
          x="56"
          y="68"
          width="12"
          height="7"
          rx="1.5"
          fill={color === "BLACK" ? "url(#goldStripe)" : "#FFFFFF"}
          stroke="#101114"
          strokeWidth="1"
        />
      )}

      {/* Subtle Spartan Chevron Crest at Top */}
      <path
        d="M40 24 L50 18 L60 24"
        stroke={color === "WHITE" ? "#333333" : "#FFFFFF"}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
    </svg>
  );

  if (variant === "compact" && !showLabel) {
    return (
      <div className={cn("inline-flex items-center justify-center", className)} title={belt.displayName}>
        {badgeSvg}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-lg border border-neutral-800 bg-neutral-900/90 px-3 py-1.5 shadow-sm backdrop-blur-sm",
        className
      )}
      title={belt.displayName}
    >
      {badgeSvg}
      <div className="flex flex-col text-left">
        <span className="text-xs font-semibold tracking-wider text-neutral-200">
          {belt.displayName}
        </span>
        <span className="text-[10px] text-neutral-400 font-mono">
          CẤP {stripes} ({belt.shortName})
        </span>
      </div>
    </div>
  );
}
