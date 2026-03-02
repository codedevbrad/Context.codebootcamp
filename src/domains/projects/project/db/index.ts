"use server";

import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import type { ActionResult } from "@/domains/contexts/db";

export type ProjectListItem = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectDetails = ProjectListItem & {
  dbmodel: unknown;
  gantttasks: unknown;
};

export type GanttTaskItem = {
  id: string;
  name: string;
  description: string;
  column: string;
  createdAt: string;
};

export type ErmModelColumn = {
  id: string;
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
};

export type ErmModelNode = {
  id: string;
  name: string;
  position: { x: number; y: number };
  rows: ErmModelColumn[];
};

export type ErmRelation = {
  id: string;
  source: string;
  target: string;
  relationType: "1:1" | "1:N" | "N:N";
};

export type ErmBoard = {
  models: ErmModelNode[];
  relations: ErmRelation[];
};

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

export async function getUserProjects(): Promise<ProjectListItem[]> {
  const userId = await getAuthUserId();
  if (!userId) {
    return [];
  }

  return prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getProjectById(projectId: string): Promise<ProjectDetails | null> {
  const userId = await getAuthUserId();
  if (!userId) {
    return null;
  }

  return prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      dbmodel: true,
      gantttasks: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createProjectAction(
  name: string,
  description: string
): Promise<ActionResult<ProjectListItem>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  const trimmedName = name.trim();
  const trimmedDescription = description.trim();

  if (!trimmedName) {
    return { success: false, error: "Project name is required" };
  }

  if (!trimmedDescription) {
    return { success: false, error: "Project description is required" };
  }

  try {
    const project = await prisma.project.create({
      data: {
        name: trimmedName,
        description: trimmedDescription,
        dbmodel: {},
        gantttasks: [],
        userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: project };
  } catch (error) {
    console.error("Error creating project:", error);
    return { success: false, error: "Failed to create project" };
  }
}

export async function updateProjectAction(
  projectId: string,
  name: string,
  description: string
): Promise<ActionResult<ProjectListItem>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  const trimmedName = name.trim();
  const trimmedDescription = description.trim();

  if (!trimmedName) {
    return { success: false, error: "Project name is required" };
  }

  if (!trimmedDescription) {
    return { success: false, error: "Project description is required" };
  }

  try {
    const existing = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Project not found" };
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: trimmedName,
        description: trimmedDescription,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: project };
  } catch (error) {
    console.error("Error updating project:", error);
    return { success: false, error: "Failed to update project" };
  }
}

export async function deleteProjectAction(
  projectId: string
): Promise<ActionResult<{ id: string }>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  try {
    const existing = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Project not found" };
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return { success: true, data: { id: projectId } };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, error: "Failed to delete project" };
  }
}

export async function updateProjectGanttTasksAction(
  projectId: string,
  gantttasks: unknown
): Promise<ActionResult<{ id: string; gantttasks: unknown }>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  if (!Array.isArray(gantttasks)) {
    return { success: false, error: "Gantt tasks must be an array" };
  }

  try {
    const existing = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Project not found" };
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { gantttasks },
      select: {
        id: true,
        gantttasks: true,
      },
    });

    return { success: true, data: project };
  } catch (error) {
    console.error("Error updating project gantt tasks:", error);
    return { success: false, error: "Failed to save gantt tasks" };
  }
}

export async function updateProjectDbModelAction(
  projectId: string,
  dbmodel: unknown
): Promise<ActionResult<{ id: string; dbmodel: unknown }>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  if (!dbmodel || typeof dbmodel !== "object") {
    return { success: false, error: "ERM board must be an object" };
  }

  try {
    const existing = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Project not found" };
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { dbmodel },
      select: {
        id: true,
        dbmodel: true,
      },
    });

    return { success: true, data: project };
  } catch (error) {
    console.error("Error updating project ERM board:", error);
    return { success: false, error: "Failed to save ERM board" };
  }
}
