"use client";

import useSWR from "swr";
import {
  deleteProjectWritingAction,
  getProjectWritingById,
  updateProjectWritingContentAction,
  updateProjectWritingTitleAction,
  type ProjectWritingDetails,
} from "@/domains/projects/writing/db";

const fetcher = async ([, projectId, writingId]: readonly [string, string, string]) =>
  getProjectWritingById(projectId, writingId);

function sanitizeJsonContent(content: unknown) {
  try {
    return JSON.parse(JSON.stringify(content));
  } catch {
    return null;
  }
}

export function useProjectWriting(
  projectId: string,
  writingId: string,
  initialData?: ProjectWritingDetails | null
) {
  const key = projectId && writingId ? (["project-writing", projectId, writingId] as const) : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    fallbackData: initialData,
  });

  const writing = data ?? null;

  const updateWritingTitle = async (title: string) => {
    const result = await updateProjectWritingTitleAction(projectId, writingId, title);

    if (result.success && result.data) {
      await mutate(result.data, { revalidate: false });
    }

    return result;
  };

  const updateWritingContent = async (content: unknown) => {
    const sanitizedContent = sanitizeJsonContent(content);
    if (!sanitizedContent || typeof sanitizedContent !== "object" || Array.isArray(sanitizedContent)) {
      return {
        success: false as const,
        error: "Writing content must be a JSON object",
      };
    }

    const result = await updateProjectWritingContentAction(
      projectId,
      writingId,
      sanitizedContent
    );

    if (result.success && result.data && writing) {
      await mutate(
        {
          ...writing,
          content: result.data.content,
          updatedAt: result.data.updatedAt,
        },
        { revalidate: false }
      );
    }

    return result;
  };

  const deleteWriting = async () => {
    const result = await deleteProjectWritingAction(projectId, writingId);
    return result;
  };

  return {
    writing,
    error,
    isLoading,
    mutate,
    updateWritingTitle,
    updateWritingContent,
    deleteWriting,
  };
}
