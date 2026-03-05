import { notFound } from "next/navigation";
import { getContextById } from "@/domains/contexts/db";
import { ContextChat } from "@/app/(project)/my/project/[projectid]/contexts/context/[contextid]/_components/context-chat";

export const dynamic = "force-dynamic";

export default async function ContextPage({
  params,
}: {
  params: Promise<{ projectid: string; contextid: string }>;
}) {
  const { contextid } = await params;
  const context = await getContextById(contextid);

  if (!context) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{context.name}</h1>
        <p className="text-muted-foreground">{context.description}</p>
      </div>

      <ContextChat
        contextId={context.id}
        initialConversation={context.conversation}
      />
    </div>
  );
}