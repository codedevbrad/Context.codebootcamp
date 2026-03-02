import { notFound } from "next/navigation";
import KanbanTasks from "@/domains/projects/gantt/_components/kanban_tasks";
import { getProjectById } from "@/domains/projects/project/db";
import ProjectSubnav from "@/app/(project)/my/project/[projectid]/_components/project-subnav";

export const dynamic = "force-dynamic";

export default async function ProjectTasksPage({
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

      <ProjectSubnav projectId={project.id} current="tasks" />

      <section className="rounded-md border p-4">
        <h2 className="text-lg font-medium">Tasks</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Create, drag, and delete tasks. Changes are saved to this project.
        </p>
        <KanbanTasks projectId={project.id} initialTasks={project.gantttasks} />
      </section>
    </div>
  );
}
