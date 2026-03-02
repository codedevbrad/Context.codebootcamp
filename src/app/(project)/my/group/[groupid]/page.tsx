import { notFound } from "next/navigation";
import { ContextGroupPage } from "@/domains/contexts/_components/context-group-page";
import { getContextGroupById } from "@/domains/contexts/db";

export const dynamic = "force-dynamic";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupid: string }>;
}) {
  const { groupid } = await params;
  const group = await getContextGroupById(groupid);

  if (!group) {
    notFound();
  }

  return <ContextGroupPage group={group} />;
}
