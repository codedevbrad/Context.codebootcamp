import { notFound } from "next/navigation";
import { getProjectById } from "@/domains/projects/project/db";
import ProjectSubnav from "@/app/(project)/my/project/[projectid]/_components/project-subnav";
import ReactFlowComponent from "@/domains/projects/erm/_components/reactflow";

export const dynamic = "force-dynamic";

export default async function ProjectErmPage({
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

      <ProjectSubnav projectId={project.id} current="erm" />

      <section className="rounded-md border p-4">
        <h2 className="text-lg font-medium">ERM</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Build your ERM board by creating models and adding rows/columns.
        </p>
        <ReactFlowComponent projectId={project.id} initialDbModel={project.dbmodel} />
      </section>
    </div>
  );
}
