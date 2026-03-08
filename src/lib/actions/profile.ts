"use server";

import { auth } from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProfile() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      interests: true,
      profilePic: true,
      productivityStreak: true,
      createdAt: true,
    },
  });

  return user;
}

export async function updateProfile(data: {
  name?: string;
  bio?: string;
  interests?: string[];
}) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      bio: data.bio,
      interests: data.interests ? JSON.stringify(data.interests) : undefined,
    },
  });

  revalidatePath("/profile");
  return user;
}

export async function getProfileStats() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalPoints, totalTasks, totalBlogs, moodCheckins] = await Promise.all([
    prisma.leaderboardEntry.aggregate({
      where: { userId: session.user.id },
      _sum: { points: true },
    }),
    prisma.todoItem.count({
      where: { userId: session.user.id, completed: true },
    }),
    prisma.blogPost.count({
      where: { userId: session.user.id },
    }),
    prisma.moodCheckIn.count({
      where: { userId: session.user.id },
    }),
  ]);

  // Calculate badges based on achievements
  const badges = [];
  if ((totalPoints._sum.points || 0) >= 100) badges.push("🌟 Point Collector");
  if (totalTasks >= 10) badges.push("✅ Task Master");
  if (totalBlogs >= 1) badges.push("✍️ Blogger");
  if (moodCheckins >= 7) badges.push("🧘 Mindful");

  return {
    totalPoints: totalPoints._sum.points || 0,
    tasksCompleted: totalTasks,
    blogsWritten: totalBlogs,
    moodCheckins,
    badges,
  };
}

export async function getDailyRecap() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [tasksToday, pointsToday, moodToday] = await Promise.all([
    prisma.todoItem.findMany({
      where: {
        userId: session.user.id,
        updatedAt: { gte: today },
      },
      select: {
        title: true,
        completed: true,
        category: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.leaderboardEntry.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        },
      },
    }),
    prisma.moodCheckIn.findFirst({
      where: {
        userId: session.user.id,
        createdAt: { gte: today },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const completedTasks = tasksToday.filter((t) => t.completed).length;
  const totalTasks = tasksToday.length;

  return {
    tasksCompleted: completedTasks,
    totalTasks,
    pointsEarned: pointsToday?.points || 0,
    mood: moodToday?.emoji,
    timeStudied: "0 hr 0 min",
    activities: tasksToday.map((t) => ({
      title: t.title,
      completed: t.completed,
      category: t.category,
      time: t.updatedAt,
    })),
  };
}

export async function getMyBlogs() {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  const blogs = await prisma.blogPost.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return blogs;
}

export async function createBlog(title: string, content: string, isPublic: boolean = true) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const blog = await prisma.blogPost.create({
    data: {
      userId: session.user.id,
      title,
      content,
      isPublic,
    },
  });

  // Award points for writing a blog
  await addPoints(session.user.id, 20);

  revalidatePath("/profile");
  revalidatePath("/explore");
  return blog;
}

export async function deleteBlog(blogId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const blog = await prisma.blogPost.findUnique({
    where: { id: blogId },
  });

  if (!blog || blog.userId !== session.user.id) {
    throw new Error("Blog not found");
  }

  await prisma.blogPost.delete({
    where: { id: blogId },
  });

  revalidatePath("/profile");
  revalidatePath("/explore");
  return { success: true };
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
