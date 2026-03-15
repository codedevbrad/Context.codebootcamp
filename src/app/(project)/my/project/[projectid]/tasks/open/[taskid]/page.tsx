import { notFound, redirect } from "next/navigation";
import { getOrCreateTaskWritingAction } from "@/domains/projects/gantt/db";

export const dynamic = "force-dynamic";

export default async function OpenTaskFilePage({
  params,
}: {
  params: Promise<{ projectid: string; taskid: string }>;
}) {
  const { projectid, taskid } = await params;
  const result = await getOrCreateTaskWritingAction({
    projectId: projectid,
    taskId: taskid,
  });

  if (!result.success || !result.data) {
    notFound();
  }

  redirect(`/my/project/${projectid}/files/${result.data.writingId}`);
}
