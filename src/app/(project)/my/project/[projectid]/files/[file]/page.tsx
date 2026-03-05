import { notFound } from "next/navigation";
import { getProjectById } from "@/domains/projects/project/db";
import { getProjectWritingById } from "@/domains/projects/writing/db";
import { ProjectWritingEditor } from "@/app/(project)/my/project/[projectid]/files/[file]/_components/project-writing-editor";

export const dynamic = "force-dynamic";

export default async function ProjectFilePage({
  params,
}: {
  params: Promise<{ projectid: string; file: string }>;
}) {
  const { projectid, file } = await params;

  const [project, writing] = await Promise.all([
    getProjectById(projectid),
    getProjectWritingById(projectid, file),
  ]);

  if (!project || !writing) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{writing.title}</h1>
        <p className="text-muted-foreground">Write and edit content for this project file.</p>
      </div>

      <ProjectWritingEditor
        projectId={project.id}
        writingId={writing.id}
        initialWriting={writing}
      />
    </div>
  );
}