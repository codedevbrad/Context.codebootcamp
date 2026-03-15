"use server";

import { auth } from "@/../auth";
import type { ActionResult } from "@/domains/contexts/db";
import { createProjectWritingContentV2 } from "@/domains/projects/writing/content";
import { prisma } from "@/lib/db";

async function getAuthUserId() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  return user?.id ?? null;
}

export async function getOrCreateTaskWritingAction(params: {
  projectId: string;
  taskId: string;
}): Promise<ActionResult<{ writingId: string }>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  try {
    const task = await prisma.ganttTasks.findFirst({
      where: {
        id: params.taskId,
        projectId: params.projectId,
        project: { userId },
      },
      select: { id: true, name: true },
    });

    if (!task) {
      return { success: false, error: "Gantt task not found" };
    }

    const trimmedTaskName = task.name.trim();
    if (!trimmedTaskName) {
      return { success: false, error: "Task name is required" };
    }

    const existingWriting = await prisma.projectWriting.findFirst({
      where: {
        projectId: params.projectId,
        userId,
        ganttTaskId: params.taskId,
      },
      select: { id: true },
    });

    if (existingWriting) {
      return { success: true, data: { writingId: existingWriting.id } };
    }

    try {
      const createdWriting = await prisma.projectWriting.create({
        data: {
          title: trimmedTaskName,
          content: createProjectWritingContentV2(),
          projectId: params.projectId,
          userId,
          ganttTaskId: params.taskId,
        },
        select: { id: true },
      });

      return { success: true, data: { writingId: createdWriting.id } };
    } catch {
      const concurrentWriting = await prisma.projectWriting.findFirst({
        where: {
          projectId: params.projectId,
          userId,
          ganttTaskId: params.taskId,
        },
        select: { id: true },
      });

      if (concurrentWriting) {
        return { success: true, data: { writingId: concurrentWriting.id } };
      }

      return { success: false, error: "Failed to create writing file for task" };
    }
  } catch (error) {
    console.error("Error creating or opening task writing file:", error);
    return { success: false, error: "Failed to open task file" };
  }
}
