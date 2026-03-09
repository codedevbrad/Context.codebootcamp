"use client";

import useSWR from "swr";
import {
  createProjectContextAction,
  deleteProjectContextAction,
  getProjectContexts,
  updateProjectContextAction,
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

  const updateContext = async (contextId: string, name: string, description: string) => {
    const result = await updateProjectContextAction(projectId, contextId, name, description);

    if (result.success && result.data) {
      const updated = result.data;
      await mutate(
        (prev) => (prev ?? []).map((context) => (context.id === contextId ? updated : context)),
        { revalidate: false }
      );
    }

    return result;
  };

  const deleteContext = async (contextId: string) => {
    const result = await deleteProjectContextAction(projectId, contextId);

    if (result.success) {
      await mutate((prev) => (prev ?? []).filter((context) => context.id !== contextId), {
        revalidate: false,
      });
    }

    return result;
  };

  return {
    contexts,
    error,
    isLoading,
    mutate,
    createContext,
    updateContext,
    deleteContext,
  };
}
