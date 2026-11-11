/**
 * Belt utility module for CODE FIGHTER OJ.
 *
 * Belts represent user rank/progression, inspired by martial arts.
 * Each belt color has three levels (I, II, III) indicated by stripe count.
 */

export type BeltColor =
  | "WHITE"
  | "YELLOW"
  | "ORANGE"
  | "GREEN"
  | "BLUE"
  | "PURPLE"
  | "BROWN"
  | "RED"
  | "BLACK";

export type BeltLevel = "LEVEL_I" | "LEVEL_II" | "LEVEL_III";

export interface BeltInfo {
  color: BeltColor;
  level: BeltLevel;
  displayName: string;
  shortName: string;
  colorHex: string;
  accentHex: string;
  textHex: string;
  stripes: number;
  order: number;
}

// ─── Color catalog ─────────────────────────────────────────────

export const BELT_COLORS: Record<
  BeltColor,
  { hex: string; accent: string; text: string; name: string; nameEn: string }
> = {
  WHITE:  { hex: "#F8F9FA", accent: "#6C757D", text: "#1A1A1A", name: "Đai Trắng",         nameEn: "White Belt"  },
  YELLOW: { hex: "#FFD60A", accent: "#B45309", text: "#1A1A1A", name: "Đai Vàng",           nameEn: "Yellow Belt" },
  ORANGE: { hex: "#FF6B35", accent: "#9A3412", text: "#FFFFFF", name: "Đai Cam",             nameEn: "Orange Belt" },
  GREEN:  { hex: "#2D9B4E", accent: "#14532D", text: "#FFFFFF", name: "Đai Xanh Lá",        nameEn: "Green Belt"  },
  BLUE:   { hex: "#2563EB", accent: "#1E3A8A", text: "#FFFFFF", name: "Đai Xanh Dương",     nameEn: "Blue Belt"   },
  PURPLE: { hex: "#7B2D8B", accent: "#4A044E", text: "#FFFFFF", name: "Đai Tím",             nameEn: "Purple Belt" },
  BROWN:  { hex: "#92400E", accent: "#451A03", text: "#FFFFFF", name: "Đai Nâu",             nameEn: "Brown Belt"  },
  RED:    { hex: "#E63946", accent: "#7F1D1D", text: "#FFFFFF", name: "Đai Đỏ",              nameEn: "Red Belt"    },
  BLACK:  { hex: "#1A1A1A", accent: "#F59E0B", text: "#F59E0B", name: "Đai Đen",             nameEn: "Black Belt"  },
};

// ─── Level → stripe count ─────────────────────────────────────

export const BELT_LEVEL_STRIPES: Record<BeltLevel, number> = {
  LEVEL_I:   1,
  LEVEL_II:  2,
  LEVEL_III: 3,
};

export const BELT_LEVEL_LABELS: Record<BeltLevel, string> = {
  LEVEL_I:   "Level I",
  LEVEL_II:  "Level II",
  LEVEL_III: "Level III",
};

// ─── Canonical ordering ───────────────────────────────────────

export const BELT_ORDER: BeltColor[] = [
  "WHITE",
  "YELLOW",
  "ORANGE",
  "GREEN",
  "BLUE",
  "PURPLE",
  "BROWN",
  "RED",
  "BLACK",
];

/** All belts in canonical order: WHITE/I … BLACK/III (27 total) */
export const ALL_BELTS: { color: BeltColor; level: BeltLevel }[] =
  BELT_ORDER.flatMap((color) =>
    (["LEVEL_I", "LEVEL_II", "LEVEL_III"] as BeltLevel[]).map((level) => ({
      color,
      level,
    }))
  );

// ─── EXP thresholds (cumulative from WHITE/I) ─────────────────

/** EXP required to reach each individual level within a belt. */
const EXP_PER_LEVEL = 500;
/** EXP bonus between belt colors. */
const EXP_PER_COLOR = 1_000;

/**
 * Returns the total EXP required to reach a given belt/level from scratch.
 */
export function getBeltThreshold(color: BeltColor, level: BeltLevel): number {
  const colorIdx = BELT_ORDER.indexOf(color);
  const levelIdx = (["LEVEL_I", "LEVEL_II", "LEVEL_III"] as BeltLevel[]).indexOf(level);
  return colorIdx * (EXP_PER_LEVEL * 3 + EXP_PER_COLOR) + levelIdx * EXP_PER_LEVEL;
}

/**
 * Returns the EXP needed to advance FROM this belt/level to the next.
 */
export function getExpToNextLevel(color: BeltColor, level: BeltLevel): number {
  if (color === "BLACK" && level === "LEVEL_III") return Infinity;
  if (level === "LEVEL_III") return EXP_PER_LEVEL + EXP_PER_COLOR;
  return EXP_PER_LEVEL;
}

// ─── Belt info builder ────────────────────────────────────────

/**
 * Build a complete BeltInfo object for a given color + level.
 */
export function getBeltInfo(color: BeltColor, level: BeltLevel): BeltInfo {
  const colorMeta  = BELT_COLORS[color];
  const colorIdx   = BELT_ORDER.indexOf(color);
  const levelIdx   = (["LEVEL_I", "LEVEL_II", "LEVEL_III"] as BeltLevel[]).indexOf(level);
  const stripes    = BELT_LEVEL_STRIPES[level];
  const order      = colorIdx * 3 + levelIdx;

  return {
    color,
    level,
    displayName: `${colorMeta.name} ${BELT_LEVEL_LABELS[level]}`,
    shortName:   `${color[0]}${level.slice(-1)}`,
    colorHex:    colorMeta.hex,
    accentHex:   colorMeta.accent,
    textHex:     colorMeta.text,
    stripes,
    order,
  };
}

// ─── Navigation helpers ───────────────────────────────────────

/**
 * Returns the global sort order (0–26) for a belt.
 */
export function getBeltOrder(color: BeltColor, level: BeltLevel): number {
  const colorIdx = BELT_ORDER.indexOf(color);
  const levelIdx = (["LEVEL_I", "LEVEL_II", "LEVEL_III"] as BeltLevel[]).indexOf(level);
  return colorIdx * 3 + levelIdx;
}

/**
 * Returns the next belt/level, or null if already at max (BLACK/III).
 */
export function getNextBelt(
  color: BeltColor,
  level: BeltLevel
): { color: BeltColor; level: BeltLevel } | null {
  if (color === "BLACK" && level === "LEVEL_III") return null;

  const levels: BeltLevel[] = ["LEVEL_I", "LEVEL_II", "LEVEL_III"];
  const levelIdx = levels.indexOf(level);

  if (levelIdx < 2) {
    return { color, level: levels[levelIdx + 1] };
  }

  // Advance to next color at LEVEL_I
  const colorIdx = BELT_ORDER.indexOf(color);
  return { color: BELT_ORDER[colorIdx + 1], level: "LEVEL_I" };
}

/**
 * Returns the previous belt/level, or null if already at min (WHITE/I).
 */
export function getPrevBelt(
  color: BeltColor,
  level: BeltLevel
): { color: BeltColor; level: BeltLevel } | null {
  if (color === "WHITE" && level === "LEVEL_I") return null;

  const levels: BeltLevel[] = ["LEVEL_I", "LEVEL_II", "LEVEL_III"];
  const levelIdx = levels.indexOf(level);

  if (levelIdx > 0) {
    return { color, level: levels[levelIdx - 1] };
  }

  const colorIdx = BELT_ORDER.indexOf(color);
  return { color: BELT_ORDER[colorIdx - 1], level: "LEVEL_III" };
}

// ─── Comparison ───────────────────────────────────────────────

/**
 * Compare two BeltInfo objects by rank order.
 * Returns negative if a < b, positive if a > b, 0 if equal.
 */
export function compareBelts(a: BeltInfo, b: BeltInfo): number {
  return a.order - b.order;
}

// ─── EXP → current belt resolver ─────────────────────────────

/**
 * Given a total EXP value, resolve which belt/level the user is on
 * and how much progress they have within the current level.
 */
export function resolveBeltFromEXP(totalExp: number): {
  color: BeltColor;
  level: BeltLevel;
  progressExp: number;
  requiredExp: number;
  progressPct: number;
} {
  let remaining = totalExp;

  for (const color of BELT_ORDER) {
    for (const level of ["LEVEL_I", "LEVEL_II", "LEVEL_III"] as BeltLevel[]) {
      const required = getExpToNextLevel(color, level);

      if (color === "BLACK" && level === "LEVEL_III") {
        return {
          color,
          level,
          progressExp: remaining,
          requiredExp: Infinity,
          progressPct: 100,
        };
      }

      if (remaining < required) {
        return {
          color,
          level,
          progressExp: remaining,
          requiredExp: required,
          progressPct: Math.min((remaining / required) * 100, 100),
        };
      }

      remaining -= required;
    }
  }

  // Fallback: max rank
  return {
    color: "BLACK",
    level: "LEVEL_III",
    progressExp: 0,
    requiredExp: Infinity,
    progressPct: 100,
  };
}

// ─── CSS helpers ──────────────────────────────────────────────

/**
 * Returns an inline style object for a belt badge background.
 */
export function getBeltStyle(color: BeltColor): React.CSSProperties {
  const meta = BELT_COLORS[color];
  return {
    backgroundColor: meta.hex,
    color:           meta.text,
    borderColor:     meta.accent,
  };
}

// Make React.CSSProperties available without importing React in this module
// (consumers import React themselves)
declare namespace React {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface CSSProperties extends Record<string, any> {}
}
