"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function getTodayLeaderboard(limit: number = 10) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const leaderboard = await prisma.leaderboardEntry.findMany({
    where: {
      date: {
        gte: today,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profilePic: true,
        },
      },
    },
    orderBy: { points: "desc" },
    take: limit,
  });

  return leaderboard.map((entry, index) => ({
    rank: index + 1,
    userId: entry.user.id,
    name: entry.user.name || "Anonymous",
    profilePic: entry.user.profilePic,
    points: entry.points,
  }));
}

export async function getAllTimeLeaderboard(limit: number = 10) {
  // Aggregate points across all days
  const leaderboard = await prisma.leaderboardEntry.groupBy({
    by: ["userId"],
    _sum: {
      points: true,
    },
    orderBy: {
      _sum: {
        points: "desc",
      },
    },
    take: limit,
  });

  // Get user details
  const userIds = leaderboard.map((entry) => entry.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      profilePic: true,
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return leaderboard.map((entry, index) => {
    const user = userMap.get(entry.userId);
    return {
      rank: index + 1,
      userId: entry.userId,
      name: user?.name || "Anonymous",
      profilePic: user?.profilePic,
      points: entry._sum.points || 0,
    };
  });
}

export async function getMyRank() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get user's points today
  const myEntry = await prisma.leaderboardEntry.findUnique({
    where: {
      userId_date: {
        userId: session.user.id,
        date: today,
      },
    },
  });

  if (!myEntry) {
    return { rank: null, points: 0 };
  }

  // Count how many users have more points
  const higherRanked = await prisma.leaderboardEntry.count({
    where: {
      date: { gte: today },
      points: { gt: myEntry.points },
    },
  });

  return {
    rank: higherRanked + 1,
    points: myEntry.points,
  };
}

export async function getUserStats() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalPoints, todayPoints, tasksCompleted, streak] = await Promise.all([
    // Total points all time
    prisma.leaderboardEntry.aggregate({
      where: { userId: session.user.id },
      _sum: { points: true },
    }),
    // Today's points
    prisma.leaderboardEntry.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        },
      },
    }),
    // Tasks completed today
    prisma.todoItem.count({
      where: {
        userId: session.user.id,
        completed: true,
        updatedAt: { gte: today },
      },
    }),
    // Calculate streak (days with activity)
    calculateStreak(session.user.id),
  ]);

  return {
    totalPoints: totalPoints._sum.points || 0,
    todayPoints: todayPoints?.points || 0,
    tasksCompleted,
    streak,
  };
}

async function calculateStreak(userId: string): Promise<number> {
  const entries = await prisma.leaderboardEntry.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    select: { date: true },
  });

  if (entries.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < entries.length; i++) {
    const entryDate = new Date(entries[i].date);
    entryDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    if (entryDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
