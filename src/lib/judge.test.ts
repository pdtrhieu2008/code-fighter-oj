import { Verdict } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { mapJudge0Verdict, normalizeOutput, outputsMatch, rewardForDifficulty } from "./judge";

describe("judge helpers", () => {
  it("normalizes CRLF and trailing whitespace without ignoring internal differences", () => {
    expect(outputsMatch("42\r\n\n", "42\n")).toBe(true);
    expect(outputsMatch("4 2\n", "42\n")).toBe(false);
    expect(normalizeOutput("answer \r\n")).toBe("answer");
  });

  it.each([
    [3, Verdict.ACCEPTED],
    [4, Verdict.WRONG_ANSWER],
    [5, Verdict.TIME_LIMIT_EXCEEDED],
    [6, Verdict.COMPILATION_ERROR],
    [13, Verdict.SYSTEM_ERROR],
    [99, Verdict.SYSTEM_ERROR],
    [undefined, Verdict.SYSTEM_ERROR],
  ] as const)("maps Judge0 status %s", (status, expected) => {
    expect(mapJudge0Verdict(status)).toBe(expected);
  });

  it.each([
    ["BEGINNER", 5], ["EASY", 10], ["MEDIUM", 25], ["HARD", 50], ["EXPERT", 100], ["UNKNOWN", 0],
  ])("assigns %s reward", (difficulty, expected) => {
    expect(rewardForDifficulty(difficulty)).toBe(expected);
  });
});
