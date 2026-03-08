"use server";

import { auth } from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ==================== STUDY GROUPS ====================

export async function createStudyGroup(name: string, description?: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const group = await prisma.studyGroup.create({
    data: {
      name,
      description,
      createdById: session.user.id,
      members: {
        create: {
          userId: session.user.id,
        },
      },
    },
  });

  revalidatePath("/community");
  return group;
}

export async function getStudyGroups(search?: string) {
  const groups = await prisma.studyGroup.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : undefined,
    include: {
      createdBy: {
        select: { name: true },
      },
      _count: {
        select: { members: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    createdBy: g.createdBy.name,
    memberCount: g._count.members,
    createdAt: g.createdAt,
  }));
}

export async function joinStudyGroup(groupId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check if already a member
  const existing = await prisma.studyGroupMember.findUnique({
    where: {
      userId_studyGroupId: {
        userId: session.user.id,
        studyGroupId: groupId,
      },
    },
  });

  if (existing) {
    throw new Error("Already a member");
  }

  await prisma.studyGroupMember.create({
    data: {
      userId: session.user.id,
      studyGroupId: groupId,
    },
  });

  // Award points for joining a group
  await addPoints(session.user.id, 5);

  revalidatePath("/community");
  return { success: true };
}

export async function leaveStudyGroup(groupId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await prisma.studyGroupMember.delete({
    where: {
      userId_studyGroupId: {
        userId: session.user.id,
        studyGroupId: groupId,
      },
    },
  });

  revalidatePath("/community");
  return { success: true };
}

export async function getMyGroups() {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  const memberships = await prisma.studyGroupMember.findMany({
    where: { userId: session.user.id },
    include: {
      studyGroup: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
  });

  return memberships.map((m) => ({
    id: m.studyGroup.id,
    name: m.studyGroup.name,
    description: m.studyGroup.description,
    memberCount: m.studyGroup._count.members,
    joinedAt: m.joinedAt,
  }));
}

// ==================== CAMPUS LOCATIONS ====================

export async function getCampusLocations() {
  const locations = await prisma.campusLocation.findMany({
    include: {
      reviews: {
        select: {
          rating: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return locations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    type: loc.type,
    description: loc.description,
    isOpen: loc.isOpen,
    avgRating:
      loc.reviews.length > 0
        ? loc.reviews.reduce((sum, r) => sum + r.rating, 0) / loc.reviews.length
        : 0,
    reviewCount: loc.reviews.length,
  }));
}

export async function updateLocationStatus(locationId: string, isOpen: boolean) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await prisma.campusLocation.update({
    where: { id: locationId },
    data: { isOpen },
  });

  // Award points for updating status
  await addPoints(session.user.id, 2);

  revalidatePath("/community");
  return { success: true };
}

export async function createCampusLocation(
  name: string,
  type: string,
  description?: string
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const location = await prisma.campusLocation.create({
    data: {
      name,
      type,
      description,
    },
  });

  revalidatePath("/community");
  revalidatePath("/explore");
  return location;
}

export async function reviewLocation(
  locationId: string,
  rating: number,
  comment?: string
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const review = await prisma.locationReview.create({
    data: {
      locationId,
      userId: session.user.id,
      rating,
      comment,
    },
  });

  // Award points for reviewing
  await addPoints(session.user.id, 10);

  revalidatePath("/explore");
  return review;
}

export async function getLocationReviews(locationId: string) {
  const reviews = await prisma.locationReview.findMany({
    where: { locationId },
    include: {
      user: {
        select: {
          name: true,
          profilePic: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return reviews;
}

// ==================== EXPLORE ====================

export async function getPublicBlogs(limit: number = 10) {
  const blogs = await prisma.blogPost.findMany({
    where: { isPublic: true },
    include: {
      user: {
        select: {
          name: true,
          profilePic: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return blogs;
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
