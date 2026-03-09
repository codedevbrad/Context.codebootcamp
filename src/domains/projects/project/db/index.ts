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

export type ProjectContextListItem = {
  id: string;
  name: string;
  description: string;
  contextGroupId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectDetails = ProjectListItem & {
  dbmodel: unknown;
  projectGantdomains: ProjectGanttDomainItem[];
  categories: CategoryOption[];
};

export type GanttTaskColumnId = "planned" | "in_progress" | "done";
export type GanttColumnType = "PLANNED" | "IN_PROGRESS" | "DONE";

export type CategoryOption = {
  id: string;
  name: string;
};

export type GanttTaskItem = {
  id: string;
  name: string;
  description: string;
  pageData: unknown;
  position: number;
  ganttcolumnType: GanttColumnType;
  categoryId: string;
  category: CategoryOption;
  projectGantdomainsId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectGanttDomainItem = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  tasks: GanttTaskItem[];
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

  const [project, categories] = await Promise.all([
    prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        dbmodel: true,
        createdAt: true,
        updatedAt: true,
        projectGantdomains: {
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            tasks: {
              orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
              select: {
                id: true,
                name: true,
                description: true,
                pageData: true,
                position: true,
                ganttcolumnType: true,
                categoryId: true,
                projectGantdomainsId: true,
                createdAt: true,
                updatedAt: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  if (!project) {
    return null;
  }

  return {
    ...project,
    categories,
  };
}

export async function getProjectContexts(
  projectId: string
): Promise<ProjectContextListItem[]> {
  const userId = await getAuthUserId();
  if (!userId) {
    return [];
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    select: { id: true },
  });

  if (!project) {
    return [];
  }

  return prisma.context.findMany({
    where: {
      userId,
      projects: {
        some: { id: projectId },
      },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      contextGroupId: true,
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

export async function createProjectContextAction(
  projectId: string,
  name: string,
  description: string
): Promise<ActionResult<ProjectContextListItem>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  const trimmedName = name.trim();
  const trimmedDescription = description.trim();

  if (!trimmedName) {
    return { success: false, error: "Context name is required" };
  }

  if (!trimmedDescription) {
    return { success: false, error: "Context description is required" };
  }

  try {
    const existingProject = await getProjectOwnership(projectId, userId);

    if (!existingProject) {
      return { success: false, error: "Project not found" };
    }

    const context = await prisma.context.create({
      data: {
        name: trimmedName,
        description: trimmedDescription,
        content: {},
        userId,
        projects: {
          connect: { id: projectId },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        contextGroupId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: context };
  } catch (error) {
    console.error("Error creating project context:", error);
    return { success: false, error: "Failed to create context" };
  }
}

export async function updateProjectContextAction(
  projectId: string,
  contextId: string,
  name: string,
  description: string
): Promise<ActionResult<ProjectContextListItem>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  const trimmedName = name.trim();
  const trimmedDescription = description.trim();

  if (!trimmedName) {
    return { success: false, error: "Context name is required" };
  }

  if (!trimmedDescription) {
    return { success: false, error: "Context description is required" };
  }

  try {
    const existingProject = await getProjectOwnership(projectId, userId);

    if (!existingProject) {
      return { success: false, error: "Project not found" };
    }

    const existingContext = await prisma.context.findFirst({
      where: {
        id: contextId,
        userId,
        projects: {
          some: { id: projectId },
        },
      },
      select: { id: true },
    });

    if (!existingContext) {
      return { success: false, error: "Context not found" };
    }

    const updatedContext = await prisma.context.update({
      where: { id: contextId },
      data: {
        name: trimmedName,
        description: trimmedDescription,
      },
      select: {
        id: true,
        name: true,
        description: true,
        contextGroupId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: updatedContext };
  } catch (error) {
    console.error("Error updating project context:", error);
    return { success: false, error: "Failed to update context" };
  }
}

export async function deleteProjectContextAction(
  projectId: string,
  contextId: string
): Promise<ActionResult<{ id: string }>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  try {
    const existingProject = await getProjectOwnership(projectId, userId);

    if (!existingProject) {
      return { success: false, error: "Project not found" };
    }

    const existingContext = await prisma.context.findFirst({
      where: {
        id: contextId,
        userId,
        projects: {
          some: { id: projectId },
        },
      },
      select: { id: true },
    });

    if (!existingContext) {
      return { success: false, error: "Context not found" };
    }

    await prisma.context.update({
      where: { id: contextId },
      data: {
        projects: {
          disconnect: { id: projectId },
        },
      },
      select: { id: true },
    });

    return { success: true, data: { id: contextId } };
  } catch (error) {
    console.error("Error deleting project context link:", error);
    return { success: false, error: "Failed to delete context" };
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

async function getProjectOwnership(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    select: { id: true },
  });
}

async function resolveCategoryId(params: {
  userId: string;
  categoryId?: string;
  newCategoryName?: string;
}): Promise<ActionResult<string>> {
  const trimmedCategoryName = params.newCategoryName?.trim() ?? "";

  if (trimmedCategoryName) {
    const existingCategory = await prisma.category.findFirst({
      where: {
        userId: params.userId,
        name: {
          equals: trimmedCategoryName,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (existingCategory) {
      return { success: true, data: existingCategory.id };
    }

    const createdCategory = await prisma.category.create({
      data: {
        name: trimmedCategoryName,
        userId: params.userId,
      },
      select: { id: true },
    });

    return { success: true, data: createdCategory.id };
  }

  if (!params.categoryId) {
    return { success: false, error: "Select a category or create a new one" };
  }

  const existingCategory = await prisma.category.findFirst({
    where: {
      id: params.categoryId,
      userId: params.userId,
    },
    select: { id: true },
  });

  if (!existingCategory) {
    return { success: false, error: "Category not found" };
  }

  return { success: true, data: existingCategory.id };
}

export async function createProjectGanttDomainAction(
  projectId: string,
  name: string,
  description: string
): Promise<ActionResult<ProjectGanttDomainItem>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  const trimmedName = name.trim();
  const trimmedDescription = description.trim();

  if (!trimmedName) {
    return { success: false, error: "Domain name is required" };
  }

  if (!trimmedDescription) {
    return { success: false, error: "Domain description is required" };
  }

  try {
    const existingProject = await getProjectOwnership(projectId, userId);

    if (!existingProject) {
      return { success: false, error: "Project not found" };
    }

    const domain = await prisma.projectGantdomains.create({
      data: {
        name: trimmedName,
        description: trimmedDescription,
        projectId,
        userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        tasks: {
          orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
          select: {
            id: true,
            name: true,
            description: true,
            pageData: true,
            position: true,
            ganttcolumnType: true,
            categoryId: true,
            projectGantdomainsId: true,
            createdAt: true,
            updatedAt: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return { success: true, data: domain };
  } catch (error) {
    console.error("Error creating project gantt domain:", error);
    return { success: false, error: "Failed to create gantt domain" };
  }
}

export async function updateProjectGanttDomainAction(
  projectId: string,
  domainId: string,
  name: string,
  description: string
): Promise<ActionResult<ProjectGanttDomainItem>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  const trimmedName = name.trim();
  const trimmedDescription = description.trim();

  if (!trimmedName) {
    return { success: false, error: "Domain name is required" };
  }

  if (!trimmedDescription) {
    return { success: false, error: "Domain description is required" };
  }

  try {
    const domain = await prisma.projectGantdomains.findFirst({
      where: {
        id: domainId,
        projectId,
        userId,
      },
      select: { id: true },
    });

    if (!domain) {
      return { success: false, error: "Gantt domain not found" };
    }

    const updatedDomain = await prisma.projectGantdomains.update({
      where: { id: domainId },
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
        tasks: {
          orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
          select: {
            id: true,
            name: true,
            description: true,
            pageData: true,
            position: true,
            ganttcolumnType: true,
            categoryId: true,
            projectGantdomainsId: true,
            createdAt: true,
            updatedAt: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return { success: true, data: updatedDomain };
  } catch (error) {
    console.error("Error updating project gantt domain:", error);
    return { success: false, error: "Failed to update gantt domain" };
  }
}

export async function deleteProjectGanttDomainAction(
  projectId: string,
  domainId: string
): Promise<ActionResult<{ id: string }>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  try {
    const domain = await prisma.projectGantdomains.findFirst({
      where: {
        id: domainId,
        projectId,
        userId,
      },
      select: { id: true },
    });

    if (!domain) {
      return { success: false, error: "Gantt domain not found" };
    }

    await prisma.$transaction([
      prisma.ganttTasks.deleteMany({
        where: {
          projectGantdomainsId: domainId,
        },
      }),
      prisma.projectGantdomains.delete({
        where: { id: domainId },
      }),
    ]);

    return { success: true, data: { id: domainId } };
  } catch (error) {
    console.error("Error deleting project gantt domain:", error);
    return { success: false, error: "Failed to delete gantt domain" };
  }
}

export async function createGanttTaskAction(params: {
  projectId: string;
  domainId: string;
  name: string;
  description: string;
  pageData?: unknown;
  ganttcolumnType?: GanttColumnType;
  categoryId?: string;
  newCategoryName?: string;
}): Promise<ActionResult<GanttTaskItem>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  const trimmedName = params.name.trim();
  const trimmedDescription = params.description.trim();

  if (!trimmedName) {
    return { success: false, error: "Task name is required" };
  }

  if (!trimmedDescription) {
    return { success: false, error: "Task description is required" };
  }

  try {
    const domain = await prisma.projectGantdomains.findFirst({
      where: {
        id: params.domainId,
        projectId: params.projectId,
        userId,
      },
      select: { id: true },
    });

    if (!domain) {
      return { success: false, error: "Gantt domain not found" };
    }

    const categoryResult = await resolveCategoryId({
      userId,
      categoryId: params.categoryId,
      newCategoryName: params.newCategoryName,
    });

    if (!categoryResult.success || !categoryResult.data) {
      return {
        success: false,
        error: categoryResult.success ? "Unable to resolve category" : categoryResult.error,
      };
    }

    const nextPosition = await prisma.ganttTasks.count({
      where: {
        projectGantdomainsId: params.domainId,
      },
    });

    const createdTask = await prisma.ganttTasks.create({
      data: {
        name: trimmedName,
        description: trimmedDescription,
        pageData: params.pageData ?? { column: "planned" },
        position: nextPosition,
        ganttcolumnType: params.ganttcolumnType ?? "PLANNED",
        categoryId: categoryResult.data,
        projectGantdomainsId: params.domainId,
        projectId: params.projectId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        pageData: true,
        position: true,
        ganttcolumnType: true,
        categoryId: true,
        projectGantdomainsId: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return { success: true, data: createdTask };
  } catch (error) {
    console.error("Error creating gantt task:", error);
    return { success: false, error: "Failed to create gantt task" };
  }
}

export async function updateGanttTaskAction(params: {
  projectId: string;
  domainId: string;
  taskId: string;
  name: string;
  description: string;
  pageData?: unknown;
  position?: number;
  ganttcolumnType?: GanttColumnType;
  categoryId?: string;
  newCategoryName?: string;
}): Promise<ActionResult<GanttTaskItem>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  const trimmedName = params.name.trim();
  const trimmedDescription = params.description.trim();

  if (!trimmedName) {
    return { success: false, error: "Task name is required" };
  }

  if (!trimmedDescription) {
    return { success: false, error: "Task description is required" };
  }

  try {
    const task = await prisma.ganttTasks.findFirst({
      where: {
        id: params.taskId,
        projectId: params.projectId,
        projectGantdomainsId: params.domainId,
        project: {
          userId,
        },
      },
      select: { id: true },
    });

    if (!task) {
      return { success: false, error: "Gantt task not found" };
    }

    const categoryResult = await resolveCategoryId({
      userId,
      categoryId: params.categoryId,
      newCategoryName: params.newCategoryName,
    });

    if (!categoryResult.success || !categoryResult.data) {
      return {
        success: false,
        error: categoryResult.success ? "Unable to resolve category" : categoryResult.error,
      };
    }

    const updatedTask = await prisma.ganttTasks.update({
      where: { id: params.taskId },
      data: {
        name: trimmedName,
        description: trimmedDescription,
        pageData: params.pageData ?? { column: "planned" },
        position: params.position,
        ganttcolumnType: params.ganttcolumnType,
        categoryId: categoryResult.data,
      },
      select: {
        id: true,
        name: true,
        description: true,
        pageData: true,
        position: true,
        ganttcolumnType: true,
        categoryId: true,
        projectGantdomainsId: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return { success: true, data: updatedTask };
  } catch (error) {
    console.error("Error updating gantt task:", error);
    return { success: false, error: "Failed to update gantt task" };
  }
}

export async function deleteGanttTaskAction(params: {
  projectId: string;
  domainId: string;
  taskId: string;
}): Promise<ActionResult<{ id: string }>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  try {
    const task = await prisma.ganttTasks.findFirst({
      where: {
        id: params.taskId,
        projectId: params.projectId,
        projectGantdomainsId: params.domainId,
        project: {
          userId,
        },
      },
      select: { id: true },
    });

    if (!task) {
      return { success: false, error: "Gantt task not found" };
    }

    await prisma.ganttTasks.delete({
      where: { id: params.taskId },
    });

    return { success: true, data: { id: params.taskId } };
  } catch (error) {
    console.error("Error deleting gantt task:", error);
    return { success: false, error: "Failed to delete gantt task" };
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
