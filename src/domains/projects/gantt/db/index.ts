"use server";

import { auth } from "@/../auth";
import type { ActionResult } from "@/domains/contexts/db";
import type { Prisma } from "@prisma/client";
import {
  buildFileSlug,
  normalizeProjectSlugRouteRef,
} from "@/lib/slug";
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

async function resolveProjectIdByRef(params: {
  projectRef: string;
  userId: string;
}): Promise<string | null> {
  const normalizedSlug = normalizeProjectSlugRouteRef(params.projectRef);
  const project = await prisma.project.findFirst({
    where: {
      userId: params.userId,
      OR: [{ slug: normalizedSlug }, { id: params.projectRef }],
    },
    select: { id: true },
  });

  return project?.id ?? null;
}

export async function getOrCreateTaskWritingAction(params: {
  projectRef: string;
  taskId: string;
}): Promise<ActionResult<{ writingSlug: string }>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  try {
    const projectId = await resolveProjectIdByRef({
      projectRef: params.projectRef,
      userId,
    });
    if (!projectId) {
      return { success: false, error: "Project not found" };
    }

    const task = await prisma.ganttTasks.findFirst({
      where: {
        id: params.taskId,
        projectId,
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
        projectId,
        userId,
        ganttTaskId: params.taskId,
      },
      select: { id: true, slug: true, title: true },
    });

    if (existingWriting) {
      const expectedSlug = buildFileSlug(existingWriting.title, existingWriting.id);
      const resolvedSlug =
        existingWriting.slug === expectedSlug
          ? existingWriting.slug
          : (
              await prisma.projectWriting.update({
                where: { id: existingWriting.id },
                data: { slug: expectedSlug },
                select: { slug: true },
              })
            ).slug;

      return { success: true, data: { writingSlug: resolvedSlug ?? expectedSlug } };
    }

    try {
      const createdWriting = await prisma.projectWriting.create({
        data: {
          title: trimmedTaskName,
          content: createProjectWritingContentV2() as unknown as Prisma.InputJsonValue,
          projectId,
          userId,
          ganttTaskId: params.taskId,
        },
        select: { id: true, slug: true, title: true },
      });

      const expectedSlug = buildFileSlug(createdWriting.title, createdWriting.id);
      const resolvedSlug =
        createdWriting.slug === expectedSlug
          ? createdWriting.slug
          : (
              await prisma.projectWriting.update({
                where: { id: createdWriting.id },
                data: { slug: expectedSlug },
                select: { slug: true },
              })
            ).slug;

      return { success: true, data: { writingSlug: resolvedSlug ?? expectedSlug } };
    } catch {
      const concurrentWriting = await prisma.projectWriting.findFirst({
        where: {
          projectId,
          userId,
          ganttTaskId: params.taskId,
        },
        select: { id: true, slug: true, title: true },
      });

      if (concurrentWriting) {
        const expectedSlug = buildFileSlug(concurrentWriting.title, concurrentWriting.id);
        const resolvedSlug =
          concurrentWriting.slug === expectedSlug
            ? concurrentWriting.slug
            : (
                await prisma.projectWriting.update({
                  where: { id: concurrentWriting.id },
                  data: { slug: expectedSlug },
                  select: { slug: true },
                })
              ).slug;

        return { success: true, data: { writingSlug: resolvedSlug ?? expectedSlug } };
      }

      return { success: false, error: "Failed to create writing file for task" };
    }
  } catch (error) {
    console.error("Error creating or opening task writing file:", error);
    return { success: false, error: "Failed to open task file" };
  }
}
