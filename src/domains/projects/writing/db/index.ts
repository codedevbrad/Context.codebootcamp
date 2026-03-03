"use server";

import { auth } from "@/../auth";
import type { ActionResult } from "@/domains/contexts/db";
import { prisma } from "@/lib/db";

const EMPTY_TIPTAP_DOC = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export type ProjectWritingListItem = {
  id: string;
  title: string;
  content: unknown;
  stamped: Date;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectWritingDetails = ProjectWritingListItem;

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

export async function getProjectWritings(
  projectId: string
): Promise<ProjectWritingListItem[]> {
  const userId = await getAuthUserId();
  if (!userId) {
    return [];
  }

  return prisma.projectWriting.findMany({
    where: {
      projectId,
      userId,
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      stamped: true,
      projectId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getProjectWritingById(
  projectId: string,
  writingId: string
): Promise<ProjectWritingDetails | null> {
  const userId = await getAuthUserId();
  if (!userId) {
    return null;
  }

  return prisma.projectWriting.findFirst({
    where: {
      id: writingId,
      projectId,
      userId,
    },
    select: {
      id: true,
      title: true,
      content: true,
      stamped: true,
      projectId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createProjectWritingAction(
  projectId: string,
  title: string
): Promise<ActionResult<ProjectWritingListItem>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return { success: false, error: "File title is required" };
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      select: { id: true },
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    const writing = await prisma.projectWriting.create({
      data: {
        title: trimmedTitle,
        content: EMPTY_TIPTAP_DOC,
        projectId,
        userId,
      },
      select: {
        id: true,
        title: true,
        content: true,
        stamped: true,
        projectId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: writing };
  } catch (error) {
    console.error("Error creating project writing:", error);
    return { success: false, error: "Failed to create writing file" };
  }
}

export async function updateProjectWritingTitleAction(
  projectId: string,
  writingId: string,
  title: string
): Promise<ActionResult<ProjectWritingListItem>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return { success: false, error: "File title is required" };
  }

  try {
    const existing = await prisma.projectWriting.findFirst({
      where: {
        id: writingId,
        projectId,
        userId,
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Writing file not found" };
    }

    const writing = await prisma.projectWriting.update({
      where: { id: writingId },
      data: { title: trimmedTitle },
      select: {
        id: true,
        title: true,
        content: true,
        stamped: true,
        projectId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: writing };
  } catch (error) {
    console.error("Error updating project writing title:", error);
    return { success: false, error: "Failed to update writing title" };
  }
}

export async function updateProjectWritingContentAction(
  projectId: string,
  writingId: string,
  content: unknown
): Promise<ActionResult<{ id: string; content: unknown; updatedAt: Date }>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return { success: false, error: "Writing content must be a JSON object" };
  }

  try {
    const existing = await prisma.projectWriting.findFirst({
      where: {
        id: writingId,
        projectId,
        userId,
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Writing file not found" };
    }

    const writing = await prisma.projectWriting.update({
      where: { id: writingId },
      data: { content },
      select: {
        id: true,
        content: true,
        updatedAt: true,
      },
    });

    return { success: true, data: writing };
  } catch (error) {
    console.error("Error updating project writing content:", error);
    return { success: false, error: "Failed to save writing content" };
  }
}

export async function deleteProjectWritingAction(
  projectId: string,
  writingId: string
): Promise<ActionResult<{ id: string }>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  try {
    const existing = await prisma.projectWriting.findFirst({
      where: {
        id: writingId,
        projectId,
        userId,
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Writing file not found" };
    }

    await prisma.projectWriting.delete({
      where: { id: writingId },
    });

    return { success: true, data: { id: writingId } };
  } catch (error) {
    console.error("Error deleting project writing:", error);
    return { success: false, error: "Failed to delete writing file" };
  }
}
