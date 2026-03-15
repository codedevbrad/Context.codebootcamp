"use client";

import useSWR from "swr";
import {
  createProjectAction,
  deleteProjectAction,
  getUserProjects,
  updateProjectAction,
  type ProjectListItem,
} from "@/domains/projects/project/db";

const fetcher = () => getUserProjects();

export function useProjects(initialData?: ProjectListItem[]) {
  const { data, error, isLoading, mutate } = useSWR("projects", fetcher, {
    fallbackData: initialData,
  });

  const projects = data ?? [];

  const createProject = async (name: string, description: string) => {
    const result = await createProjectAction(name, description);

    if (result.success && result.data) {
      const created = result.data;
      await mutate((prev) => [created, ...(prev ?? [])], { revalidate: false });
    }

    return result;
  };

  const updateProject = async (projectId: string, name: string, description: string) => {
    const result = await updateProjectAction(projectId, name, description);

    if (result.success && result.data) {
      const updated = result.data;
      await mutate(
        (prev) =>
          (prev ?? []).map((project) =>
            project.id === projectId ? updated : project
          ),
        { revalidate: false }
      );
    }

    return result;
  };

  const deleteProject = async (projectId: string) => {
    const result = await deleteProjectAction(projectId);

    if (result.success) {
      await mutate(
        (prev) => (prev ?? []).filter((project) => project.id !== projectId),
        { revalidate: false }
      );
    }

    return result;
  };

  return {
    projects,
    error,
    isLoading,
    mutate,
    createProject,
    updateProject,
    deleteProject,
  };
}
