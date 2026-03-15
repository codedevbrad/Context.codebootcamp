"use client";

import useSWR from "swr";
import {
  addProjectWritingPageAction,
  deleteProjectWritingPageAction,
  deleteProjectWritingAction,
  getProjectWritingById,
  renameProjectWritingPageAction,
  updateProjectWritingActivePageAction,
  updateProjectWritingContentAction,
  updateProjectWritingPageContentAction,
  updateProjectWritingTitleAction,
  type ProjectWritingDetails,
} from "@/domains/projects/writing/db";

const fetcher = async ([, projectRef, writingRef]: readonly [string, string, string]) =>
  getProjectWritingById(projectRef, writingRef);

function sanitizeJsonContent(content: unknown) {
  try {
    return JSON.parse(JSON.stringify(content));
  } catch {
    return null;
  }
}

export function useProjectWriting(
  projectRef: string,
  writingRef: string,
  initialData?: ProjectWritingDetails | null
) {
  const key = projectRef && writingRef ? (["project-writing", projectRef, writingRef] as const) : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    fallbackData: initialData,
  });

  const writing = data ?? null;

  const mutateWritingContent = async (payload: { content: unknown; updatedAt: Date }) => {
    if (!writing) {
      return;
    }

    await mutate(
      {
        ...writing,
        content: payload.content,
        updatedAt: payload.updatedAt,
      },
      { revalidate: false }
    );
  };

  const updateWritingTitle = async (title: string) => {
    const result = await updateProjectWritingTitleAction(projectRef, writingRef, title);

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
      projectRef,
      writingRef,
      sanitizedContent
    );

    if (result.success && result.data) {
      await mutateWritingContent(result.data);
    }

    return result;
  };

  const updatePageContent = async (pageId: string, content: unknown) => {
    const sanitizedContent = sanitizeJsonContent(content);
    if (!sanitizedContent || typeof sanitizedContent !== "object" || Array.isArray(sanitizedContent)) {
      return {
        success: false as const,
        error: "Writing content must be a JSON object",
      };
    }

    const result = await updateProjectWritingPageContentAction(
      projectRef,
      writingRef,
      pageId,
      sanitizedContent
    );

    if (result.success && result.data) {
      await mutateWritingContent(result.data);
    }

    return result;
  };

  const setActivePage = async (pageId: string) => {
    const result = await updateProjectWritingActivePageAction(projectRef, writingRef, pageId);
    if (result.success && result.data) {
      await mutateWritingContent(result.data);
    }

    return result;
  };

  const addPage = async (title?: string) => {
    const result = await addProjectWritingPageAction(projectRef, writingRef, title);
    if (result.success && result.data) {
      await mutateWritingContent(result.data);
    }

    return result;
  };

  const renamePage = async (pageId: string, title: string) => {
    const result = await renameProjectWritingPageAction(projectRef, writingRef, pageId, title);
    if (result.success && result.data) {
      await mutateWritingContent(result.data);
    }

    return result;
  };

  const deletePage = async (pageId: string) => {
    const result = await deleteProjectWritingPageAction(projectRef, writingRef, pageId);
    if (result.success && result.data) {
      await mutateWritingContent(result.data);
    }

    return result;
  };

  const deleteWriting = async () => {
    const result = await deleteProjectWritingAction(projectRef, writingRef);
    return result;
  };

  return {
    writing,
    error,
    isLoading,
    mutate,
    updateWritingTitle,
    updateWritingContent,
    updatePageContent,
    setActivePage,
    addPage,
    renamePage,
    deletePage,
    deleteWriting,
  };
}
