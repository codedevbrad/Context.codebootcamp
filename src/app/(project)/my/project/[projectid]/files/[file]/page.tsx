import { notFound } from "next/navigation";
import { getProjectById } from "@/domains/projects/project/db";
import { getProjectWritingById } from "@/domains/projects/writing/db";
import { ProjectWritingEditor } from "@/app/(project)/my/project/[projectid]/files/[file]/_components/project-writing-editor";
import Link from "next/link";
import { LinkIcon } from "lucide-react";
import { GoBackButton } from "@/components/custom/goBack";

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
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col gap-4 overflow-hidden">
      <div className="shrink-0 space-y-2 flex flex-row gap-3 items-center">

        <div>
          <Link href={`/my/project/${project.id}/files`}>
            <GoBackButton variant="outline"  />
          </Link>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold">{writing.title}</h1>
            <p className="text-muted-foreground">Write and edit content for this project file.</p>
          </div>
          {writing.ganttTask ? (
            <Link
              href={`/my/project/${project.id}/tasks`}
              className="w-full max-w-sm rounded-md border p-2 hover:bg-accent/30"
            >
              <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <LinkIcon className="size-3.5" />
                Related Task
              </p>
              <p className="truncate text-sm font-medium">{writing.ganttTask.name}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {writing.ganttTask.description}
              </p>
            </Link>
          ) : null}
        </div>
      </div>

    

      <div className="flex-1 min-h-0 overflow-hidden">
        <ProjectWritingEditor
          projectId={project.id}
          writingId={writing.id}
          initialWriting={writing}
        />
      </div>
    </div>
  );
}