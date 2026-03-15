import { notFound } from "next/navigation";
import { getContextByRef } from "@/domains/contexts/db";
import { ContextChat } from "@/app/(project)/my/project/[projectid]/contexts/context/[contextid]/_components/context-chat";
import Link from "next/link";
import { GoBackButton } from "@/components/custom/goBack";

export const dynamic = "force-dynamic";

export default async function ContextPage({
  params,
}: {
  params: Promise<{ projectid: string; contextid: string }>;
}) {
  const { projectid: projectSlug, contextid: contextRef } = await params;
  const context = await getContextByRef(contextRef);

  if (!context) {
    notFound();
  }
    
  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col gap-4 overflow-hidden">
      <div className="space-y-1 shrink-0 flex flex-row gap-3 items-center">
        <div>
          <Link href={`/my/project/${projectSlug}/contexts`}>
            <GoBackButton variant="outline" />
          </Link>
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{context.name}</h1>
          <p className="text-muted-foreground">{context.description}</p>
        </div>
      </div>

      <ContextChat
        contextRef={contextRef}
        initialConversation={context.conversation}
      />
    </div>
  );
}