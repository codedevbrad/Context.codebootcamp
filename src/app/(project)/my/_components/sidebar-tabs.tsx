"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ContextSidebar } from "@/domains/contexts/_components/context-sidebar";
import type { ContextGroupListItem } from "@/domains/contexts/db";
import { ProjectSidebar } from "@/domains/projects/project/_components/project-sidebar";
import type { ProjectListItem } from "@/domains/projects/project/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SidebarTabsProps = {
  initialContextGroups: ContextGroupListItem[];
  initialProjects: ProjectListItem[];
};

function inferActiveTab(pathname: string) {
  return pathname.startsWith("/my/project/") ? "projects" : "contexts";
}

export function SidebarTabs({ initialContextGroups, initialProjects }: SidebarTabsProps) {
  const pathname = usePathname();
  const routeTab = useMemo(() => inferActiveTab(pathname), [pathname]);
  const [activeTab, setActiveTab] = useState(routeTab);

  useEffect(() => {
    setActiveTab(routeTab);
  }, [routeTab]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="w-full">
        <TabsTrigger value="contexts">Contexts</TabsTrigger>
        <TabsTrigger value="projects">Projects</TabsTrigger>
      </TabsList>
      <TabsContent value="contexts">
        <ContextSidebar initialGroups={initialContextGroups} />
      </TabsContent>
      <TabsContent value="projects">
        <ProjectSidebar initialProjects={initialProjects} />
      </TabsContent>
    </Tabs>
  );
}
