"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type HelpType = "item" | "wtf" | "prof" | "advice";

export async function createHelpRequest(
  type: HelpType,
  title: string,
  description?: string
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const helpRequest = await prisma.helpRequest.create({
    data: {
      userId: session.user.id,
      type,
      title,
      description,
    },
  });

  revalidatePath("/home");
  return helpRequest;
}

export async function getHelpRequests(type?: HelpType, limit: number = 10) {
  const helpRequests = await prisma.helpRequest.findMany({
    where: {
      ...(type && { type }),
      status: "open",
    },
    include: {
      user: {
        select: {
          name: true,
          profilePic: true,
        },
      },
      responses: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return helpRequests;
}

export async function getMyHelpRequests() {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  const helpRequests = await prisma.helpRequest.findMany({
    where: { userId: session.user.id },
    include: {
      responses: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return helpRequests;
}

export async function respondToHelp(helpRequestId: string, content: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const response = await prisma.helpResponse.create({
    data: {
      helpRequestId,
      responderId: session.user.id,
      content,
    },
  });

  // Award points for helping
  await addPoints(session.user.id, 15);

  revalidatePath("/home");
  return response;
}

export async function resolveHelpRequest(helpRequestId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const helpRequest = await prisma.helpRequest.findUnique({
    where: { id: helpRequestId },
  });

  if (!helpRequest || helpRequest.userId !== session.user.id) {
    throw new Error("Help request not found");
  }

  const updated = await prisma.helpRequest.update({
    where: { id: helpRequestId },
    data: { status: "resolved" },
  });

  revalidatePath("/home");
  return updated;
}

async function addPoints(userId: string, points: number) {
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
