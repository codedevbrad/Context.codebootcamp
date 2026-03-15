"use server";

import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import type { ActionResult } from "@/domains/contexts/db";
import {
  buildContextSlug,
  buildProjectSlug,
  normalizeContextSlugRouteRef,
  normalizeProjectSlugRouteRef,
  slugifyContextName,
  slugifyProjectName,
} from "@/lib/slug";

export type ProjectListItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectContextListItem = {
  id: string;
  slug: string;
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

async function getProjectOwnership(projectRef: string, userId: string) {
  const projectId = await resolveProjectIdByRef({
    projectRef,
    userId,
  });
  if (!projectId) {
    return null;
  }

  return { id: projectId };
}

type ContextRecordWithNullableSlug = {
  id: string;
  slug: string | null;
  name: string;
  description: string;
  contextGroupId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeProjectContextRecord<T extends ContextRecordWithNullableSlug>(
  context: T
): ProjectContextListItem {
  return {
    id: context.id,
    slug: context.slug ?? context.id,
    name: context.name,
    description: context.description,
    contextGroupId: context.contextGroupId,
    createdAt: context.createdAt,
    updatedAt: context.updatedAt,
  };
}

async function resolveContextIdByRef(params: {
  projectId: string;
  userId: string;
  contextRef: string;
}): Promise<string | null> {
  const normalizedSlug = normalizeContextSlugRouteRef(params.contextRef);
  const context = await prisma.context.findFirst({
    where: {
      userId: params.userId,
      projects: {
        some: { id: params.projectId },
      },
      OR: [{ slug: normalizedSlug }, { id: params.contextRef }],
    },
    select: { id: true },
  });

  return context?.id ?? null;
}

function normalizeProjectRecord<T extends { id: string; slug: string | null }>(project: T) {
  return {
    ...project,
    slug: project.slug ?? project.id,
  };
}

export async function getUserProjects(): Promise<ProjectListItem[]> {
  const userId = await getAuthUserId();
  if (!userId) {
    return [];
  }

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return projects.map((project) => normalizeProjectRecord(project));
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
        slug: true,
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
    ...normalizeProjectRecord(project),
    categories,
  };
}

export async function getProjectBySlug(projectSlug: string): Promise<ProjectDetails | null> {
  const userId = await getAuthUserId();
  if (!userId) {
    return null;
  }

  const normalizedSlug = normalizeProjectSlugRouteRef(projectSlug);
  const [project, categories] = await Promise.all([
    prisma.project.findFirst({
      where: {
        slug: normalizedSlug,
        userId,
      },
      select: {
        id: true,
        slug: true,
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
    ...normalizeProjectRecord(project),
    categories,
  };
}

export async function getProjectContexts(
  projectRef: string
): Promise<ProjectContextListItem[]> {
  const userId = await getAuthUserId();
  if (!userId) {
    return [];
  }

  const projectId = await resolveProjectIdByRef({
    projectRef,
    userId,
  });

  if (!projectId) {
    return [];
  }

  const contexts = await prisma.context.findMany({
    where: {
      userId,
      projects: {
        some: { id: projectId },
      },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      contextGroupId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return contexts.map((context) => normalizeProjectContextRecord(context));
}

export async function getProjectTaskCount(projectId: string): Promise<number> {
  const userId = await getAuthUserId();
  if (!userId) {
    return 0;
  }

  const resolvedProjectId = await resolveProjectIdByRef({
    projectRef: projectId,
    userId,
  });

  if (!resolvedProjectId) {
    return 0;
  }

  return prisma.ganttTasks.count({
    where: {
      projectId: resolvedProjectId,
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
    const provisionalSlug = `${slugifyProjectName(trimmedName)}-${Date.now().toString(36)}${Math.random()
      .toString(36)
      .slice(2, 6)}`;

    const createdProject = await prisma.project.create({
      data: {
        name: trimmedName,
        description: trimmedDescription,
        slug: provisionalSlug,
        dbmodel: {},
        userId,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const expectedSlug = buildProjectSlug(trimmedName, createdProject.id);
    const project =
      createdProject.slug === expectedSlug
        ? createdProject
        : await prisma.project.update({
            where: { id: createdProject.id },
            data: { slug: expectedSlug },
            select: {
              id: true,
              slug: true,
              name: true,
              description: true,
              createdAt: true,
              updatedAt: true,
            },
          });

    return { success: true, data: normalizeProjectRecord(project) };
  } catch (error) {
    console.error("Error creating project:", error);
    return { success: false, error: "Failed to create project" };
  }
}

export async function createProjectContextAction(
  projectRef: string,
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
    const existingProject = await getProjectOwnership(projectRef, userId);

    if (!existingProject) {
      return { success: false, error: "Project not found" };
    }

    const provisionalSlug = `${slugifyContextName(trimmedName)}-${Date.now().toString(36)}${Math.random()
      .toString(36)
      .slice(2, 6)}`;

    const createdContext = await prisma.context.create({
      data: {
        name: trimmedName,
        description: trimmedDescription,
        slug: provisionalSlug,
        content: {},
        userId,
        projects: {
          connect: { id: existingProject.id },
        },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        contextGroupId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const expectedSlug = buildContextSlug(trimmedName, createdContext.id);
    const context =
      createdContext.slug === expectedSlug
        ? createdContext
        : await prisma.context.update({
            where: { id: createdContext.id },
            data: { slug: expectedSlug },
            select: {
              id: true,
              slug: true,
              name: true,
              description: true,
              contextGroupId: true,
              createdAt: true,
              updatedAt: true,
            },
          });

    return { success: true, data: normalizeProjectContextRecord(context) };
  } catch (error) {
    console.error("Error creating project context:", error);
    return { success: false, error: "Failed to create context" };
  }
}

export async function updateProjectContextAction(
  projectRef: string,
  contextRef: string,
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
    const existingProject = await getProjectOwnership(projectRef, userId);

    if (!existingProject) {
      return { success: false, error: "Project not found" };
    }

    const contextId = await resolveContextIdByRef({
      projectId: existingProject.id,
      userId,
      contextRef,
    });
    if (!contextId) {
      return { success: false, error: "Context not found" };
    }

    const updatedContext = await prisma.context.update({
      where: { id: contextId },
      data: {
        name: trimmedName,
        description: trimmedDescription,
        slug: buildContextSlug(trimmedName, contextId),
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        contextGroupId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: normalizeProjectContextRecord(updatedContext) };
  } catch (error) {
    console.error("Error updating project context:", error);
    return { success: false, error: "Failed to update context" };
  }
}

export async function deleteProjectContextAction(
  projectRef: string,
  contextRef: string
): Promise<ActionResult<{ id: string }>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  try {
    const existingProject = await getProjectOwnership(projectRef, userId);

    if (!existingProject) {
      return { success: false, error: "Project not found" };
    }

    const contextId = await resolveContextIdByRef({
      projectId: existingProject.id,
      userId,
      contextRef,
    });
    if (!contextId) {
      return { success: false, error: "Context not found" };
    }

    await prisma.context.update({
      where: { id: contextId },
      data: {
        projects: {
          disconnect: { id: existingProject.id },
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
  projectRef: string,
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
    const existing = await getProjectOwnership(projectRef, userId);

    if (!existing) {
      return { success: false, error: "Project not found" };
    }

    const project = await prisma.project.update({
      where: { id: existing.id },
      data: {
        name: trimmedName,
        description: trimmedDescription,
        slug: buildProjectSlug(trimmedName, existing.id),
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: normalizeProjectRecord(project) };
  } catch (error) {
    console.error("Error updating project:", error);
    return { success: false, error: "Failed to update project" };
  }
}

export async function deleteProjectAction(
  projectRef: string
): Promise<ActionResult<{ id: string }>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  try {
    const existing = await getProjectOwnership(projectRef, userId);

    if (!existing) {
      return { success: false, error: "Project not found" };
    }

    await prisma.project.delete({
      where: { id: existing.id },
    });

    return { success: true, data: { id: existing.id } };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, error: "Failed to delete project" };
  }
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
  projectRef: string,
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
    const existingProject = await getProjectOwnership(projectRef, userId);

    if (!existingProject) {
      return { success: false, error: "Project not found" };
    }

    const domain = await prisma.projectGantdomains.create({
      data: {
        name: trimmedName,
        description: trimmedDescription,
        projectId: existingProject.id,
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
  projectRef: string,
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
    const existingProject = await getProjectOwnership(projectRef, userId);
    if (!existingProject) {
      return { success: false, error: "Project not found" };
    }

    const domain = await prisma.projectGantdomains.findFirst({
      where: {
        id: domainId,
        projectId: existingProject.id,
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
  projectRef: string,
  domainId: string
): Promise<ActionResult<{ id: string }>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  try {
    const existingProject = await getProjectOwnership(projectRef, userId);
    if (!existingProject) {
      return { success: false, error: "Project not found" };
    }

    const domain = await prisma.projectGantdomains.findFirst({
      where: {
        id: domainId,
        projectId: existingProject.id,
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
  projectRef: string;
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
    const projectId = await resolveProjectIdByRef({
      projectRef: params.projectRef,
      userId,
    });
    if (!projectId) {
      return { success: false, error: "Project not found" };
    }

    const domain = await prisma.projectGantdomains.findFirst({
      where: {
        id: params.domainId,
        projectId,
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
        projectId,
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
  projectRef: string;
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
  projectRef: string;
  domainId: string;
  taskId: string;
}): Promise<ActionResult<{ id: string }>> {
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
  projectRef: string,
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
    const existing = await getProjectOwnership(projectRef, userId);

    if (!existing) {
      return { success: false, error: "Project not found" };
    }

    const project = await prisma.project.update({
      where: { id: existing.id },
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
