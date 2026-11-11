import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalFighters, totalProblems, totalSubmissions, totalContests, totalStudents] =
      await Promise.all([
        prisma.fighterProfile.count(),
        prisma.problem.count({ where: { visibility: "PUBLIC" } }),
        prisma.submission.count(),
        prisma.contest.count(),
        prisma.user.count({ where: { role: "STUDENT" } }),
      ]);

    return NextResponse.json({
      totalFighters,
      totalProblems,
      totalSubmissions,
      totalContests,
      totalStudents,
    });
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json(
      {
        totalFighters: 0,
        totalProblems: 0,
        totalSubmissions: 0,
        totalContests: 0,
        totalStudents: 0,
      },
      { status: 200 }
    );
  }
}
