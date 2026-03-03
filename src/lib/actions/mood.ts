"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createMoodCheckIn(emoji: string, note?: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const moodCheckIn = await prisma.moodCheckIn.create({
    data: {
      userId: session.user.id,
      emoji,
      note,
    },
  });

  // Award points for checking in
  await updateUserPoints(session.user.id, 5);

  revalidatePath("/home");
  revalidatePath("/profile");
  
  return moodCheckIn;
}

export async function getMoodHistory(limit: number = 7) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return [];
  }

  const moods = await prisma.moodCheckIn.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return moods;
}

export async function getTodaysMood() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mood = await prisma.moodCheckIn.findFirst({
    where: {
      userId: session.user.id,
      createdAt: {
        gte: today,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return mood;
}

async function updateUserPoints(userId: string, points: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.leaderboardEntry.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    update: {
      points: { increment: points },
    },
    create: {
      userId,
      points,
      date: today,
    },
  });
}
