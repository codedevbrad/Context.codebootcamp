"use client";
import { useState } from "react";
import { ProjectSidebar } from "@/domains/projects/projects/_components/projectSidebar/project-sidebar";
import type { ProjectListItem } from "@/domains/projects/project/db";

type SidebarTabsProps = {
  initialProjects: ProjectListItem[];
};

export function SidebarTabs({initialProjects }: SidebarTabsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`min-h-0 overflow-y-auto md:h-full md:shrink-0 transition-all ${
        isCollapsed ? "w-20" : "w-1/5"
      }`}
    >
      <ProjectSidebar
        initialProjects={initialProjects}
        isCollapsed={isCollapsed}
        onToggleCollapsed={() => setIsCollapsed((prev) => !prev)}
      />
    </div>
  );
}
