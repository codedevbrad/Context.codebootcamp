"use server";

import { auth } from "@/../auth";
import type { ActionResult } from "@/domains/contexts/db";
import { prisma } from "@/lib/db";
import {
  addProjectWritingPage,
  createProjectWritingContentV2,
  deleteProjectWritingPage,
  renameProjectWritingPage,
  setActiveProjectWritingPage,
  toProjectWritingContentV2,
  updateProjectWritingPageContent,
} from "@/domains/projects/writing/content";

export type ProjectWritingListItem = {
  id: string;
  title: string;
  content: unknown;
  stamped: Date;
  projectId: string;
  ganttTaskId: string | null;
  ganttTask: {
    id: string;
    name: string;
    description: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectWritingDetails = ProjectWritingListItem;

function normalizeWritingRecord<T extends { content: unknown }>(writing: T): T {
  return {
    ...writing,
    content: toProjectWritingContentV2(writing.content),
  };
}

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

  const writings = await prisma.projectWriting.findMany({
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
      ganttTaskId: true,
      ganttTask: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  return writings.map((writing) => normalizeWritingRecord(writing));
}

export async function getProjectWritingById(
  projectId: string,
  writingId: string
): Promise<ProjectWritingDetails | null> {
  const userId = await getAuthUserId();
  if (!userId) {
    return null;
  }

  const writing = await prisma.projectWriting.findFirst({
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
      ganttTaskId: true,
      ganttTask: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!writing) {
    return null;
  }

  return normalizeWritingRecord(writing);
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
        content: createProjectWritingContentV2(),
        projectId,
        userId,
      },
      select: {
        id: true,
        title: true,
        content: true,
        stamped: true,
        projectId: true,
        ganttTaskId: true,
        ganttTask: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: normalizeWritingRecord(writing) };
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
        ganttTaskId: true,
        ganttTask: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: normalizeWritingRecord(writing) };
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

    const normalizedContent = toProjectWritingContentV2(content);

    const writing = await prisma.projectWriting.update({
      where: { id: writingId },
      data: { content: normalizedContent },
      select: {
        id: true,
        content: true,
        updatedAt: true,
      },
    });

    return { success: true, data: normalizeWritingRecord(writing) };
  } catch (error) {
    console.error("Error updating project writing content:", error);
    return { success: false, error: "Failed to save writing content" };
  }
}

async function getExistingWritingWithContent(projectId: string, writingId: string, userId: string) {
  return prisma.projectWriting.findFirst({
    where: {
      id: writingId,
      projectId,
      userId,
    },
    select: {
      id: true,
      content: true,
    },
  });
}

export async function addProjectWritingPageAction(
  projectId: string,
  writingId: string,
  title?: string
): Promise<ActionResult<{ id: string; content: unknown; updatedAt: Date }>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  try {
    const existing = await getExistingWritingWithContent(projectId, writingId, userId);

    if (!existing) {
      return { success: false, error: "Writing file not found" };
    }

    const nextContent = addProjectWritingPage(existing.content, title?.trim());
    const writing = await prisma.projectWriting.update({
      where: { id: writingId },
      data: { content: nextContent },
      select: {
        id: true,
        content: true,
        updatedAt: true,
      },
    });

    return { success: true, data: normalizeWritingRecord(writing) };
  } catch (error) {
    console.error("Error adding project writing page:", error);
    return { success: false, error: "Failed to add page" };
  }
}

export async function renameProjectWritingPageAction(
  projectId: string,
  writingId: string,
  pageId: string,
  title: string
): Promise<ActionResult<{ id: string; content: unknown; updatedAt: Date }>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return { success: false, error: "Page title is required" };
  }

  try {
    const existing = await getExistingWritingWithContent(projectId, writingId, userId);

    if (!existing) {
      return { success: false, error: "Writing file not found" };
    }

    const nextContent = renameProjectWritingPage(existing.content, pageId, trimmedTitle);
    if (!nextContent) {
      return { success: false, error: "Writing page not found" };
    }

    const writing = await prisma.projectWriting.update({
      where: { id: writingId },
      data: { content: nextContent },
      select: {
        id: true,
        content: true,
        updatedAt: true,
      },
    });

    return { success: true, data: normalizeWritingRecord(writing) };
  } catch (error) {
    console.error("Error renaming project writing page:", error);
    return { success: false, error: "Failed to rename page" };
  }
}

export async function deleteProjectWritingPageAction(
  projectId: string,
  writingId: string,
  pageId: string
): Promise<ActionResult<{ id: string; content: unknown; updatedAt: Date }>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  try {
    const existing = await getExistingWritingWithContent(projectId, writingId, userId);

    if (!existing) {
      return { success: false, error: "Writing file not found" };
    }

    const nextContent = deleteProjectWritingPage(existing.content, pageId);
    if (!nextContent) {
      return { success: false, error: "At least one page is required" };
    }

    const writing = await prisma.projectWriting.update({
      where: { id: writingId },
      data: { content: nextContent },
      select: {
        id: true,
        content: true,
        updatedAt: true,
      },
    });

    return { success: true, data: normalizeWritingRecord(writing) };
  } catch (error) {
    console.error("Error deleting project writing page:", error);
    return { success: false, error: "Failed to delete page" };
  }
}

export async function updateProjectWritingActivePageAction(
  projectId: string,
  writingId: string,
  pageId: string
): Promise<ActionResult<{ id: string; content: unknown; updatedAt: Date }>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  try {
    const existing = await getExistingWritingWithContent(projectId, writingId, userId);

    if (!existing) {
      return { success: false, error: "Writing file not found" };
    }

    const nextContent = setActiveProjectWritingPage(existing.content, pageId);
    if (!nextContent) {
      return { success: false, error: "Writing page not found" };
    }

    const writing = await prisma.projectWriting.update({
      where: { id: writingId },
      data: { content: nextContent },
      select: {
        id: true,
        content: true,
        updatedAt: true,
      },
    });

    return { success: true, data: normalizeWritingRecord(writing) };
  } catch (error) {
    console.error("Error updating active project writing page:", error);
    return { success: false, error: "Failed to switch page" };
  }
}

export async function updateProjectWritingPageContentAction(
  projectId: string,
  writingId: string,
  pageId: string,
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
    const existing = await getExistingWritingWithContent(projectId, writingId, userId);

    if (!existing) {
      return { success: false, error: "Writing file not found" };
    }

    const nextContent = updateProjectWritingPageContent(existing.content, pageId, content);
    if (!nextContent) {
      return { success: false, error: "Writing page not found" };
    }

    const writing = await prisma.projectWriting.update({
      where: { id: writingId },
      data: { content: nextContent },
      select: {
        id: true,
        content: true,
        updatedAt: true,
      },
    });

    return { success: true, data: normalizeWritingRecord(writing) };
  } catch (error) {
    console.error("Error updating project writing page content:", error);
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
