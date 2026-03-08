import { notFound } from "next/navigation";
import { getProjectById } from "@/domains/projects/project/db";
import { getProjectWritingById } from "@/domains/projects/writing/db";
import { ProjectWritingEditor } from "@/app/(project)/my/project/[projectid]/files/[file]/_components/project-writing-editor";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
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
      <div className="space-y-1 shrink-0 flex flex-row gap-3 items-center">
        <div>
          <Link href={`/my/project/${project.id}/files`}>
            <GoBackButton variant="outline">
              <ArrowLeftIcon className="w-4 h-4" />
              Back to files
            </GoBackButton>
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{writing.title}</h1>
          <p className="text-muted-foreground">Write and edit content for this project file.</p>
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