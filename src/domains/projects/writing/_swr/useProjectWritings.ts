"use client";

import useSWR from "swr";
import {
  createProjectWritingAction,
  deleteProjectWritingAction,
  getProjectWritings,
  updateProjectWritingTitleAction,
  type ProjectWritingListItem,
} from "@/domains/projects/writing/db";

const fetcher = async ([, projectId]: readonly [string, string]) =>
  getProjectWritings(projectId);

export function useProjectWritings(projectId: string, initialData?: ProjectWritingListItem[]) {
  const key = projectId ? (["project-writings", projectId] as const) : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    fallbackData: initialData,
  });

  const writings = data ?? [];

  const createWriting = async (title: string) => {
    const result = await createProjectWritingAction(projectId, title);

    if (result.success && result.data) {
      const created = result.data;
      await mutate((prev) => [created, ...(prev ?? [])], { revalidate: false });
    }

    return result;
  };

  const updateWritingTitle = async (writingId: string, title: string) => {
    const result = await updateProjectWritingTitleAction(projectId, writingId, title);

    if (result.success && result.data) {
      const updated = result.data;
      await mutate(
        (prev) =>
          (prev ?? []).map((writing) => (writing.id === writingId ? updated : writing)),
        { revalidate: false }
      );
    }

    return result;
  };

  const deleteWriting = async (writingId: string) => {
    const result = await deleteProjectWritingAction(projectId, writingId);

    if (result.success) {
      await mutate((prev) => (prev ?? []).filter((writing) => writing.id !== writingId), {
        revalidate: false,
      });
    }

    return result;
  };

  return {
    writings,
    error,
    isLoading,
    mutate,
    createWriting,
    updateWritingTitle,
    deleteWriting,
  };
}
