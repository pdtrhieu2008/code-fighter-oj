import { describe, it, expect } from "vitest";
import { calculateICPCStandings } from "./icpc-scoreboard";

describe("ICPC Scoreboard Engine", () => {
  const startTime = new Date("2026-11-09T00:00:00Z");

  const problems = [
    { id: "p1", problemLabel: "A" },
    { id: "p2", problemLabel: "B" },
  ];

  const participants = [
    { userId: "u1", username: "spartan1", fighterId: "CF-000001", rating: 1500 },
    { userId: "u2", username: "spartan2", fighterId: "CF-000002", rating: 1400 },
  ];

  it("calculates penalty correctly with wrong attempts before AC", () => {
    const submissions = [
      // u1: Wrong Answer on A at minute 10, then Accepted at minute 25
      {
        userId: "u1",
        problemId: "p1",
        verdict: "WRONG_ANSWER",
        submittedAt: new Date("2026-11-09T00:10:00Z"),
      },
      {
        userId: "u1",
        problemId: "p1",
        verdict: "ACCEPTED",
        submittedAt: new Date("2026-11-09T00:25:00Z"),
      },
    ];

    const standings = calculateICPCStandings(startTime, problems, participants, submissions);
    const u1Standing = standings.find((s) => s.userId === "u1")!;

    expect(u1Standing.totalSolved).toBe(1);
    // 25 (minutes) + 1 * 20 (penalty) = 45
    expect(u1Standing.totalPenalty).toBe(45);
    expect(u1Standing.rank).toBe(1);
  });

  it("does not penalize wrong attempts on problems that were never solved", () => {
    const submissions = [
      // u2 attempts problem B 3 times with WA, never solves it
      {
        userId: "u2",
        problemId: "p2",
        verdict: "WRONG_ANSWER",
        submittedAt: new Date("2026-11-09T00:05:00Z"),
      },
      {
        userId: "u2",
        problemId: "p2",
        verdict: "WRONG_ANSWER",
        submittedAt: new Date("2026-11-09T00:15:00Z"),
      },
    ];

    const standings = calculateICPCStandings(startTime, problems, participants, submissions);
    const u2Standing = standings.find((s) => s.userId === "u2")!;

    expect(u2Standing.totalSolved).toBe(0);
    expect(u2Standing.totalPenalty).toBe(0);
  });

  it("ranks participant with more solved problems higher regardless of penalty", () => {
    const submissions = [
      // u1 solves A at minute 10 (penalty: 10)
      {
        userId: "u1",
        problemId: "p1",
        verdict: "ACCEPTED",
        submittedAt: new Date("2026-11-09T00:10:00Z"),
      },
      // u2 solves A at minute 50 and B at minute 60 (total solved: 2, penalty: 110)
      {
        userId: "u2",
        problemId: "p1",
        verdict: "ACCEPTED",
        submittedAt: new Date("2026-11-09T00:50:00Z"),
      },
      {
        userId: "u2",
        problemId: "p2",
        verdict: "ACCEPTED",
        submittedAt: new Date("2026-11-09T01:00:00Z"),
      },
    ];

    const standings = calculateICPCStandings(startTime, problems, participants, submissions);

    expect(standings[0].userId).toBe("u2");
    expect(standings[0].rank).toBe(1);
    expect(standings[1].userId).toBe("u1");
    expect(standings[1].rank).toBe(2);
  });
});
