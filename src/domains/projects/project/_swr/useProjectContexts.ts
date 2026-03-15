"use client";

import useSWR from "swr";
import {
  createProjectContextAction,
  deleteProjectContextAction,
  getProjectContexts,
  updateProjectContextAction,
  type ProjectContextListItem,
} from "@/domains/projects/project/db";

const fetcher = async ([, projectRef]: readonly [string, string]) =>
  getProjectContexts(projectRef);

export function useProjectContexts(
  projectRef: string,
  initialData?: ProjectContextListItem[]
) {
  const key = projectRef ? (["project-contexts", projectRef] as const) : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    fallbackData: initialData,
  });

  const contexts = data ?? [];

  const createContext = async (name: string, description: string) => {
    const result = await createProjectContextAction(projectRef, name, description);

    if (result.success && result.data) {
      const created = result.data;
      await mutate((prev) => [created, ...(prev ?? [])], { revalidate: false });
    }

    return result;
  };

  const updateContext = async (contextRef: string, name: string, description: string) => {
    const result = await updateProjectContextAction(projectRef, contextRef, name, description);

    if (result.success && result.data) {
      const updated = result.data;
      await mutate(
        (prev) =>
          (prev ?? []).map((context) =>
            context.id === contextRef || context.slug === contextRef ? updated : context
          ),
        { revalidate: false }
      );
    }

    return result;
  };

  const deleteContext = async (contextRef: string) => {
    const result = await deleteProjectContextAction(projectRef, contextRef);

    if (result.success) {
      await mutate(
        (prev) =>
          (prev ?? []).filter(
            (context) => context.id !== contextRef && context.slug !== contextRef
          ),
        {
          revalidate: false,
        }
      );
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
