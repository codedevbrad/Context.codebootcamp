import { getUserProjects } from "@/domains/projects/project/db";
import { ProjectsPageList } from "@/app/(project)/my/projects/_components/projects-page-list";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getUserProjects();

  return <ProjectsPageList initialProjects={projects} />;
}
