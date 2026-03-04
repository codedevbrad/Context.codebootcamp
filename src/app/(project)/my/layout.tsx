import { getUserContextGroups } from "@/domains/contexts/db";
import { getUserProjects } from "@/domains/projects/project/db";
import { SidebarTabs } from "@/app/(project)/my/_components/sidebar-tabs";
import { AppBreadcrumb } from "@/components/custom/breadcrumb";

export default async function MyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const contextGroups = await getUserContextGroups();
  const projects = await getUserProjects();

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden md:flex-row">
      <div className="min-h-0 overflow-y-auto md:h-full md:shrink-0 w-1/5">
        <SidebarTabs initialContextGroups={contextGroups} initialProjects={projects} />
      </div>
      <div className="min-w-0 min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-4">
          <AppBreadcrumb />
          {children}
        </div>
      </div>
    </div>
  );
}