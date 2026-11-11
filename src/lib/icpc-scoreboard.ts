export interface ProblemResult {
  problemId: string;
  problemLabel: string;
  solved: boolean;
  acceptedAtMinute: number | null;
  wrongAttempts: number;
  penalty: number;
}

export interface FighterStanding {
  userId: string;
  username: string;
  fighterId: string;
  rating: number;
  rank: number;
  totalSolved: number;
  totalPenalty: number;
  lastAcceptedMinute: number;
  problemResults: Record<string, ProblemResult>;
}

export interface RawContestSubmission {
  userId: string;
  problemId: string;
  verdict: string;
  submittedAt: Date;
}

/**
 * Calculates ICPC Standings from contest submissions.
 * Rule:
 * 1. Solved: submission with verdict === "ACCEPTED"
 * 2. Penalty = (accepted_minute + 20 * wrong_attempts_before_acceptance)
 * 3. Wrong attempts after AC or on problems never solved incur 0 penalty.
 * 4. Ranking: Most Solved DESC -> Lowest Penalty ASC -> Earliest Last AC ASC.
 */
export function calculateICPCStandings(
  contestStartTime: Date,
  problems: { id: string; problemLabel: string }[],
  participants: { userId: string; username: string; fighterId: string; rating: number }[],
  submissions: RawContestSubmission[]
): FighterStanding[] {
  const standingsMap: Record<string, FighterStanding> = {};

  // Initialize participants
  for (const p of participants) {
    const pResults: Record<string, ProblemResult> = {};
    for (const prob of problems) {
      pResults[prob.id] = {
        problemId: prob.id,
        problemLabel: prob.problemLabel,
        solved: false,
        acceptedAtMinute: null,
        wrongAttempts: 0,
        penalty: 0,
      };
    }

    standingsMap[p.userId] = {
      userId: p.userId,
      username: p.username,
      fighterId: p.fighterId,
      rating: p.rating,
      rank: 1,
      totalSolved: 0,
      totalPenalty: 0,
      lastAcceptedMinute: 0,
      problemResults: pResults,
    };
  }

  // Sort submissions chronologically
  const sortedSubs = [...submissions].sort(
    (a, b) => a.submittedAt.getTime() - b.submittedAt.getTime()
  );

  const startMs = contestStartTime.getTime();

  for (const sub of sortedSubs) {
    const standing = standingsMap[sub.userId];
    if (!standing) continue;

    const probRes = standing.problemResults[sub.problemId];
    if (!probRes) continue;

    // If already solved, ignore subsequent submissions
    if (probRes.solved) continue;

    const subMinute = Math.max(0, Math.floor((sub.submittedAt.getTime() - startMs) / 60000));

    if (sub.verdict === "ACCEPTED") {
      probRes.solved = true;
      probRes.acceptedAtMinute = subMinute;
      probRes.penalty = subMinute + probRes.wrongAttempts * 20;

      standing.totalSolved += 1;
      standing.totalPenalty += probRes.penalty;
      standing.lastAcceptedMinute = Math.max(standing.lastAcceptedMinute, subMinute);
    } else {
      probRes.wrongAttempts += 1;
    }
  }

  // Convert to array and sort by ICPC rules
  const list = Object.values(standingsMap);
  list.sort((a, b) => {
    // 1. Most solved problems
    if (b.totalSolved !== a.totalSolved) {
      return b.totalSolved - a.totalSolved;
    }
    // 2. Lowest penalty
    if (a.totalPenalty !== b.totalPenalty) {
      return a.totalPenalty - b.totalPenalty;
    }
    // 3. Earliest last accepted timestamp
    return a.lastAcceptedMinute - b.lastAcceptedMinute;
  });

  // Assign ranks
  let currentRank = 1;
  for (let i = 0; i < list.length; i++) {
    if (
      i > 0 &&
      list[i].totalSolved === list[i - 1].totalSolved &&
      list[i].totalPenalty === list[i - 1].totalPenalty
    ) {
      list[i].rank = list[i - 1].rank;
    } else {
      list[i].rank = currentRank;
    }
    currentRank++;
  }

  return list;
}
