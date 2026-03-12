"use client";

import useSWR from "swr";
import { getProjectTaskCount } from "@/domains/projects/project/db";

const fetcher = async ([, projectId]: readonly [string, string]) =>
  getProjectTaskCount(projectId);

export function useProjectTaskCount(projectId: string, initialData?: number) {
  const key = projectId ? (["project-task-count", projectId] as const) : null;

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
