"use client";

import useSWR from "swr";
import {
  createProjectWritingAction,
  deleteProjectWritingAction,
  getProjectWritings,
  updateProjectWritingTitleAction,
  type ProjectWritingListItem,
} from "@/domains/projects/writing/db";

const fetcher = async ([, projectRef]: readonly [string, string]) =>
  getProjectWritings(projectRef);

export function useProjectWritings(projectRef: string, initialData?: ProjectWritingListItem[]) {
  const key = projectRef ? (["project-writings", projectRef] as const) : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    fallbackData: initialData,
  });

  const writings = data ?? [];

  const createWriting = async (title: string) => {
    const result = await createProjectWritingAction(projectRef, title);

    if (result.success && result.data) {
      const created = result.data;
      await mutate((prev) => [created, ...(prev ?? [])], { revalidate: false });
    }

    return result;
  };

  const updateWritingTitle = async (writingRef: string, title: string) => {
    const result = await updateProjectWritingTitleAction(projectRef, writingRef, title);

    if (result.success && result.data) {
      const updated = result.data;
      await mutate(
        (prev) =>
          (prev ?? []).map((writing) =>
            writing.slug === writingRef || writing.id === writingRef ? updated : writing
          ),
        { revalidate: false }
      );
    }

    return result;
  };

  const deleteWriting = async (writingRef: string) => {
    const result = await deleteProjectWritingAction(projectRef, writingRef);

    if (result.success) {
      await mutate(
        (prev) =>
          (prev ?? []).filter(
            (writing) => writing.slug !== writingRef && writing.id !== writingRef
          ),
        {
          revalidate: false,
        }
      );
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
