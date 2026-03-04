"use client";
import { ProjectSidebar } from "@/domains/projects/project/_components/project-sidebar";
import type { ProjectListItem } from "@/domains/projects/project/db";

type SidebarTabsProps = {
  initialProjects: ProjectListItem[];
};

export function SidebarTabs({initialProjects }: SidebarTabsProps) {

  return (
    <ProjectSidebar initialProjects={initialProjects} />
  );
}
