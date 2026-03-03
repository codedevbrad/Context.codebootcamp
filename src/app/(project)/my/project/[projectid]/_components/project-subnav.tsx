import Link from "next/link";
import { cn } from "@/lib/utils";

type Section = "overview" | "files" | "tasks" | "erm";

type ProjectSubnavProps = {
  projectId: string;
  current: Section;
};

const sections: Array<{ id: Section; label: string; href: (projectId: string) => string }> = [
  { id: "overview", label: "overview", href: (projectId) => `/my/project/${projectId}` },
  { id: "files", label: "Files", href: (projectId) => `/my/project/${projectId}/files` },
  { id: "tasks", label: "Tasks", href: (projectId) => `/my/project/${projectId}/tasks` },
  { id: "erm", label: "ERM", href: (projectId) => `/my/project/${projectId}/erm` },
];

export default function ProjectSubnav({ projectId, current }: ProjectSubnavProps) {
  return (
    <nav className="flex items-center gap-2 border-b pb-3" aria-label="Project sections">
      {sections.map((section) => (
        <Link
          key={section.id}
          href={section.href(projectId)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            current === section.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {section.label}
        </Link>
      ))}
    </nav>
  );
}
