"use client";

import useSWR from "swr";
import {
  createProjectContextAction,
  getProjectContexts,
  type ProjectContextListItem,
} from "@/domains/projects/project/db";

const fetcher = async ([, projectId]: readonly [string, string]) =>
  getProjectContexts(projectId);

export function useProjectContexts(
  projectId: string,
  initialData?: ProjectContextListItem[]
) {
  const key = projectId ? (["project-contexts", projectId] as const) : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    fallbackData: initialData,
  });

  const contexts = data ?? [];

  const createContext = async (name: string, description: string) => {
    const result = await createProjectContextAction(projectId, name, description);

    if (result.success && result.data) {
      const created = result.data;
      await mutate((prev) => [created, ...(prev ?? [])], { revalidate: false });
    }

    return result;
  };

  return {
    contexts,
    error,
    isLoading,
    mutate,
    createContext,
  };
}
