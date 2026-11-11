import { Language, Verdict } from "@prisma/client";

export const JUDGE0_LANGUAGE_IDS = {
  CPP17: 54,
  CPP20: 76,
  PYTHON3: 71,
  JAVA: 62,
} as const;

export type SupportedJudgeLanguage = keyof typeof JUDGE0_LANGUAGE_IDS;

export const PRISMA_LANGUAGES: Record<SupportedJudgeLanguage, Language> = {
  CPP17: Language.CPP17,
  CPP20: Language.CPP20,
  PYTHON3: Language.PYTHON3,
  JAVA: Language.JAVA,
};

const JUDGE0_VERDICTS: Record<number, Verdict> = {
  3: Verdict.ACCEPTED,
  4: Verdict.WRONG_ANSWER,
  5: Verdict.TIME_LIMIT_EXCEEDED,
  6: Verdict.COMPILATION_ERROR,
  7: Verdict.RUNTIME_ERROR,
  8: Verdict.RUNTIME_ERROR,
  9: Verdict.TIME_LIMIT_EXCEEDED,
  10: Verdict.RUNTIME_ERROR,
  11: Verdict.RUNTIME_ERROR,
  12: Verdict.RUNTIME_ERROR,
  13: Verdict.SYSTEM_ERROR,
  14: Verdict.SYSTEM_ERROR,
};

export function mapJudge0Verdict(statusId: number | undefined): Verdict {
  return statusId === undefined
    ? Verdict.SYSTEM_ERROR
    : (JUDGE0_VERDICTS[statusId] ?? Verdict.SYSTEM_ERROR);
}

export function normalizeOutput(output: string): string {
  return output.replace(/\r\n/g, "\n").trimEnd();
}

export function outputsMatch(actual: string, expected: string): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected);
}

export function rewardForDifficulty(difficulty: string): number {
  switch (difficulty) {
    case "BEGINNER": return 5;
    case "EASY": return 10;
    case "MEDIUM": return 25;
    case "HARD": return 50;
    case "EXPERT": return 100;
    default: return 0;
  }
}

export const MAX_SOURCE_LENGTH = 100_000;
export const MAX_CUSTOM_INPUT_LENGTH = 32_000;
