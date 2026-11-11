import React from "react";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ContestDetailView } from "./ContestDetailView";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ContestDetailPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();

  const contest = await prisma.contest.findUnique({
    where: { slug },
    include: {
      problems: {
        orderBy: { orderIndex: "asc" },
        include: {
          problem: {
            select: {
              id: true,
              title: true,
              slug: true,
              timeLimit: true,
              memoryLimit: true,
              difficulty: true,
            },
          },
        },
      },
      _count: {
        select: {
          participants: true,
        },
      },
      participants: session?.user?.id
        ? {
            where: { userId: session.user.id },
          }
        : false,
    },
  });

  if (!contest) {
    notFound();
  }

  const isRegistered =
    Array.isArray(contest.participants) && contest.participants.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#101114]">
      <Navbar
        user={
          session?.user
            ? {
                username: (session.user as any).username,
                fighterId: (session.user as any).fighterId,
                role: (session.user as any).role,
              }
            : null
        }
      />

      <main className="flex-1 container mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <ContestDetailView
          contest={contest}
          isRegistered={isRegistered}
          isLoggedIn={!!session?.user}
        />
      </main>

      <Footer />
    </div>
  );
}
