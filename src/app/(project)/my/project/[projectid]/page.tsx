import { notFound } from "next/navigation";
import { getProjectById } from "@/domains/projects/project/db";
import ProjectSubnav from "@/app/(project)/my/project/[projectid]/_components/project-subnav";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectid: string }>;
}) {
  const { projectid } = await params;
  const project = await getProjectById(projectid);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <p className="text-muted-foreground">{project.description}</p>
      </div>

      <ProjectSubnav projectId={project.id} current="overview" />

      <section className="rounded-md border p-4">
        <h2 className="text-lg font-medium">Details</h2>
      
      </section> 
    </div>
  );
}
