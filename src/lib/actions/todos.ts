"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type TodoCategory = "health" | "study" | "reminder" | "skill";

export async function createTodo(
  title: string,
  category: TodoCategory,
  dueDate?: Date
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const todo = await prisma.todoItem.create({
    data: {
      userId: session.user.id,
      title,
      category,
      dueDate,
    },
  });

  revalidatePath("/checklist");
  return todo;
}

export async function getTodos(category?: TodoCategory) {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  const todos = await prisma.todoItem.findMany({
    where: {
      userId: session.user.id,
      ...(category && { category }),
    },
    orderBy: [
      { completed: "asc" },
      { createdAt: "desc" },
    ],
  });

  return todos;
}

export async function toggleTodo(todoId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const todo = await prisma.todoItem.findUnique({
    where: { id: todoId },
  });

  if (!todo || todo.userId !== session.user.id) {
    throw new Error("Todo not found");
  }

  const updatedTodo = await prisma.todoItem.update({
    where: { id: todoId },
    data: { completed: !todo.completed },
  });

  // Award points for completing a task
  if (updatedTodo.completed) {
    await addPoints(session.user.id, 10);
  }

  revalidatePath("/checklist");
  revalidatePath("/home");
  return updatedTodo;
}

export async function deleteTodo(todoId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const todo = await prisma.todoItem.findUnique({
    where: { id: todoId },
  });

  if (!todo || todo.userId !== session.user.id) {
    throw new Error("Todo not found");
  }

  await prisma.todoItem.delete({
    where: { id: todoId },
  });

  revalidatePath("/checklist");
  return { success: true };
}

export async function getTodoStats() {
  const session = await auth();

  if (!session?.user?.id) {
    return { completed: 0, total: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [completed, total] = await Promise.all([
    prisma.todoItem.count({
      where: {
        userId: session.user.id,
        completed: true,
        updatedAt: { gte: today },
      },
    }),
    prisma.todoItem.count({
      where: {
        userId: session.user.id,
        completed: false,
      },
    }),
  ]);

  return { completed, total: completed + total };
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
