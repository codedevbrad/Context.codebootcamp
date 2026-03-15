"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProjectTaskCount } from "@/domains/projects/project/_swr/useProjectTaskCount";
import type { ProjectListItem } from "@/domains/projects/project/db";
import { ProjectContextsAccordion } from "@/domains/projects/projects/_components/projectSidebar/project-contexts-accordion";
import { ProjectFilesAccordion } from "@/domains/projects/projects/_components/projectSidebar/project-files-accordion";
import { useProjects } from "@/domains/projects/projects/_swr/useProjects";

type ProjectsPageListProps = {
  initialProjects: ProjectListItem[];
};

type PageProjectItem = Omit<ProjectListItem, "createdAt" | "updatedAt"> & {
  createdAt: Date | string;
  updatedAt: Date | string;
};

function toTimestamp(value: Date | string) {
  return new Date(value).getTime();
}

type ProjectSectionProps = {
  projectId: string;
  pathname: string;
};

function ProjectTasksLink({ projectId, pathname }: ProjectSectionProps) {
  const { taskCount, isLoading } = useProjectTaskCount(projectId);
  const tasksHref = `/my/project/${projectId}/tasks`;
  const isActive = pathname === tasksHref || pathname.startsWith(`${tasksHref}/`);

  return (
    <div className="mt-4">
      <Link
        href={tasksHref}
        className={`block rounded p-2 py-1 ${
          isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
        }`}
      >
        <h3 className="text-xs text-gray-600">Tasks [{isLoading ? "..." : taskCount}]</h3>
      </Link>
    </div>
  );
}

export function ProjectsPageList({ initialProjects }: ProjectsPageListProps) {
  const pathname = usePathname();
  const { projects, isLoading } = useProjects(initialProjects);

  const sortedProjects = useMemo(
    () =>
      [...(projects as PageProjectItem[])].sort((a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt)),
    [projects]
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Browse all your projects and jump into files, tasks, and contexts.
        </p>
      </div>

      {isLoading && sortedProjects.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading projects...</p>
      ) : null}

      {sortedProjects.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          No projects yet. Create one from the sidebar New button.
        </div>
      ) : (
        <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedProjects.map((project) => {
            const href = `/my/project/${project.id}`;
            const isActive = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <div
                key={project.id}
                className={`rounded-md border border-border p-3 transition-colors ${
                  isActive ? "border-primary/40 bg-accent/30" : "hover:bg-accent/20"
                }`}
              >
                <Link href={href} className="min-w-0 rounded px-2 py-1 text-sm" title={project.name}>
                  <p className="truncate font-medium">{project.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{project.description}</p>
                </Link>

                <ProjectTasksLink projectId={project.id} pathname={pathname} />
                <ProjectFilesAccordion projectId={project.id} pathname={pathname} />
                <ProjectContextsAccordion projectId={project.id} pathname={pathname} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
