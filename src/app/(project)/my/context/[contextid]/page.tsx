import Link from "next/link";
import { notFound } from "next/navigation";
import { getContextById } from "@/domains/contexts/db";

export const dynamic = "force-dynamic";

export default async function ContextPage({
  params,
}: {
  params: Promise<{ contextid: string }>;
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

      <section className="rounded-md border p-4">
        <h2 className="text-lg font-medium">Details</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Group</dt>
            <dd>
              {context.contextGroup ? (
                <Link
                  href={`/my/group/${context.contextGroup.id}`}
                  className="underline underline-offset-2"
                >
                  {context.contextGroup.name}
                </Link>
              ) : (
                "No group"
              )}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}