import { notFound } from "next/navigation";
import { getProjectById } from "@/domains/projects/project/db";
import { getProjectWritings } from "@/domains/projects/writing/db";
import ProjectSubnav from "@/app/(project)/my/project/[projectid]/_components/project-subnav";
import { ProjectFilesList } from "@/app/(project)/my/project/[projectid]/files/_components/project-files-list";

export const dynamic = "force-dynamic";

export default async function ProjectFilesPage({
  params,
}: {
  params: Promise<{ projectid: string }>;
}) {
  const { projectid } = await params;

  const [project, writings] = await Promise.all([
    getProjectById(projectid),
    getProjectWritings(projectid),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <p> { project.description } </p>
      </div>

      <ProjectSubnav projectId={project.id} current="files" />
      <ProjectFilesList projectId={project.id} initialWritings={writings} />
    </div>
  );
}