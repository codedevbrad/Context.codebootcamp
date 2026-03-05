"use server";

import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { askOpenAI } from "@/services/openai";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export type ContextGroupListItem = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ContextListItem = {
  id: string;
  name: string;
  description: string;
  contextGroupId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ContextChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type ContextDetailItem = {
  id: string;
  name: string;
  description: string;
  content: unknown;
  contextGroupId: string | null;
  createdAt: Date;
  updatedAt: Date;
  contextGroup: {
    id: string;
    name: string;
  } | null;
};

function parseConversation(content: unknown): ContextChatMessage[] {
  if (typeof content !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is ContextChatMessage => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const candidate = item as {
        role?: unknown;
        content?: unknown;
        createdAt?: unknown;
      };

      return (
        (candidate.role === "user" || candidate.role === "assistant") &&
        typeof candidate.content === "string" &&
        typeof candidate.createdAt === "string"
      );
    });
  } catch {
    return [];
  }
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

export async function getUserContextGroups(): Promise<ContextGroupListItem[]> {
  const userId = await getAuthUserId();
  if (!userId) {
    return [];
  }

  return prisma.contextGroup.findMany({
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

export async function getContextGroupById(groupId: string) {
  const userId = await getAuthUserId();
  if (!userId) {
    return null;
  }

  return prisma.contextGroup.findFirst({
    where: {
      id: groupId,
      userId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      contexts: {
        select: {
          id: true,
          name: true,
          description: true,
          contextGroupId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
}

export async function getContextById(contextId: string) {
  const userId = await getAuthUserId();
  if (!userId) {
    return null;
  }

  const context = await prisma.context.findFirst({
    where: {
      id: contextId,
      userId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      content: true,
      contextGroupId: true,
      createdAt: true,
      updatedAt: true,
      contextGroup: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!context) {
    return null;
  }

  return {
    ...context,
    conversation: parseConversation(context.content),
  };
}

export async function createContextGroupAction(
  name: string,
  description: string
): Promise<ActionResult<ContextGroupListItem>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  const trimmedName = name.trim();
  const trimmedDescription = description.trim();

  if (!trimmedName) {
    return { success: false, error: "Group name is required" };
  }

  if (!trimmedDescription) {
    return { success: false, error: "Group description is required" };
  }

  try {
    const group = await prisma.contextGroup.create({
      data: {
        name: trimmedName,
        description: trimmedDescription,
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

    return { success: true, data: group };
  } catch (error) {
    console.error("Error creating context group:", error);
    return { success: false, error: "Failed to create context group" };
  }
}

export async function updateContextGroupAction(
  groupId: string,
  name: string,
  description: string
): Promise<ActionResult<ContextGroupListItem>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  const trimmedName = name.trim();
  const trimmedDescription = description.trim();

  if (!trimmedName) {
    return { success: false, error: "Group name is required" };
  }

  if (!trimmedDescription) {
    return { success: false, error: "Group description is required" };
  }

  try {
    const existing = await prisma.contextGroup.findFirst({
      where: {
        id: groupId,
        userId,
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Context group not found" };
    }

    const group = await prisma.contextGroup.update({
      where: { id: groupId },
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

    return { success: true, data: group };
  } catch (error) {
    console.error("Error updating context group:", error);
    return { success: false, error: "Failed to update context group" };
  }
}

export async function deleteContextGroupAction(
  groupId: string
): Promise<ActionResult<{ id: string }>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  try {
    const existing = await prisma.contextGroup.findFirst({
      where: {
        id: groupId,
        userId,
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Context group not found" };
    }

    await prisma.contextGroup.delete({
      where: { id: groupId },
    });

    return { success: true, data: { id: groupId } };
  } catch (error) {
    console.error("Error deleting context group:", error);
    return { success: false, error: "Failed to delete context group" };
  }
}

export async function createContextInGroupAction(
  groupId: string,
  name: string,
  description: string
): Promise<ActionResult<ContextListItem>> {
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
    const group = await prisma.contextGroup.findFirst({
      where: {
        id: groupId,
        userId,
      },
      select: { id: true },
    });

    if (!group) {
      return { success: false, error: "Context group not found" };
    }

    const context = await prisma.context.create({
      data: {
        name: trimmedName,
        description: trimmedDescription,
        content: {},
        userId,
        contextGroupId: groupId,
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
    console.error("Error creating context in group:", error);
    return { success: false, error: "Failed to create context" };
  }
}

export async function askContextQuestionAction(
  contextId: string,
  question: string
): Promise<ActionResult<{ reply: string; conversation: ContextChatMessage[] }>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) {
    return { success: false, error: "Question is required" };
  }

  try {
    const context = (await prisma.context.findFirst({
      where: {
        id: contextId,
        userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        content: true,
        contextGroupId: true,
        createdAt: true,
        updatedAt: true,
        contextGroup: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })) as ContextDetailItem | null;

    if (!context) {
      return { success: false, error: "Context not found" };
    }

    const previousConversation = parseConversation(context.content);
    const userMessage: ContextChatMessage = {
      role: "user",
      content: trimmedQuestion,
      createdAt: new Date().toISOString(),
    };

    const recentConversation = [...previousConversation, userMessage].slice(-20);

    const assistantReply =
      (await askOpenAI([
        {
          role: "system",
          content: `You are a helpful assistant for a project context.
Context name: ${context.name}
Context description: ${context.description}
Keep answers concise and practical.`,
        },
        ...recentConversation.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ])) || "I could not generate a response.";

    const assistantMessage: ContextChatMessage = {
      role: "assistant",
      content: assistantReply,
      createdAt: new Date().toISOString(),
    };

    const updatedConversation = [...previousConversation, userMessage, assistantMessage];

    await prisma.context.update({
      where: { id: contextId },
      data: {
        content: JSON.stringify(updatedConversation),
      },
    });

    return {
      success: true,
      data: {
        reply: assistantReply,
        conversation: updatedConversation,
      },
    };
  } catch (error) {
    console.error("Error asking context question:", error);
    return { success: false, error: "Failed to generate answer" };
  }
}
