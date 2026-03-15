"use client";

import useSWR from "swr";
import { getProjectTaskCount } from "@/domains/projects/project/db";

const fetcher = async ([, projectRef]: readonly [string, string]) =>
  getProjectTaskCount(projectRef);

export function useProjectTaskCount(projectRef: string, initialData?: number) {
  const key = projectRef ? (["project-task-count", projectRef] as const) : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    fallbackData: initialData,
  });

  return {
    taskCount: data ?? 0,
    error,
    isLoading,
    mutate,
  };
}
