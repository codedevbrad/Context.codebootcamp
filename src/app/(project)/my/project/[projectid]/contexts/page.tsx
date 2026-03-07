import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectById, getProjectContexts } from "@/domains/projects/project/db";

export const dynamic = "force-dynamic";

export default async function ProjectContextsPage({
  params,
}: {
  params: Promise<{ projectid: string }>;
}) {
  const { projectid } = await params;

  const [project, contexts] = await Promise.all([
    getProjectById(projectid),
    getProjectContexts(projectid),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <p className="text-muted-foreground">{project.description}</p>
      </div>

      <section className="rounded-md border p-4">
        <h2 className="text-lg font-medium">Contexts</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Contexts linked to this project.
        </p>

        {contexts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No contexts linked yet. Add one from the project sidebar.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {contexts.map((context) => (
              <li key={context.id} className="rounded border p-2">
                <Link
                  href={`/my/project/${project.id}/contexts/context/${context.id}`}
                  className="block"
                >
                  <p className="font-medium">{context.name}</p>
                  <p className="text-sm text-muted-foreground">{context.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
