import ProjectSubnav from "@/app/(project)/my/project/[projectid]/_components/project-subnav";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectid: string }>;
}) {
  const { projectid } = await params;

  return (
    <div className="space-y-4">
      <ProjectSubnav projectSlug={projectid} />
      {children}
    </div>
  );
}
