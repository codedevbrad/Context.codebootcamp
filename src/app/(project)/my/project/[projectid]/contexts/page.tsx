import { notFound } from "next/navigation";
import { getProjectBySlug, getProjectContexts } from "@/domains/projects/project/db";
import { ProjectContextsList } from "@/app/(project)/my/project/[projectid]/contexts/_components/project-contexts-list";

export const dynamic = "force-dynamic";

export default async function ProjectContextsPage({
  params,
}: {
  params: Promise<{ projectid: string }>;
}) {
  const { projectid } = await params;

  const [project, contexts] = await Promise.all([
    getProjectBySlug(projectid),
    getProjectContexts(projectid),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <p className="text-muted-foreground">{project.description}</p>
      </div>

      <ProjectContextsList projectSlug={project.slug} initialContexts={contexts} />
    </div>
  );
}
