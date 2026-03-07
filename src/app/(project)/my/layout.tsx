import { getUserProjects } from "@/domains/projects/project/db";
import { SidebarTabs } from "@/app/(project)/my/_components/sidebar-tabs";
import { MyLayoutScrollShell } from "@/app/(project)/my/_components/my-layout-scroll-shell";
import { AppBreadcrumb } from "@/components/custom/breadcrumb";

export default async function MyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const projects = await getUserProjects();

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden md:flex-row">
      <SidebarTabs initialProjects={projects} />
      <MyLayoutScrollShell>
        <AppBreadcrumb />
        {children}
      </MyLayoutScrollShell>
    </div>
  );
}