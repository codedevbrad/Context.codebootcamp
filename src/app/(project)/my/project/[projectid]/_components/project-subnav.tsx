"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type ProjectSubnavProps = {
  projectId: string;
};

const sections = [
  { id: "overview", label: "Overview", href: (projectId: string) => `/my/project/${projectId}` },
  { id: "files", label: "Files", href: (projectId: string) => `/my/project/${projectId}/files` },
  { id: "contexts", label: "Contexts", href: (projectId: string) => `/my/project/${projectId}/contexts` },
  { id: "tasks", label: "Tasks", href: (projectId: string) => `/my/project/${projectId}/tasks` },
  { id: "erm", label: "ERM", href: (projectId: string) => `/my/project/${projectId}/erm` },
];

export default function ProjectSubnav({ projectId }: ProjectSubnavProps) {
  const pathname = usePathname();
  const projectBase = `/my/project/${projectId}`;

  return (
    <nav className="flex items-center gap-2 border-b pb-3" aria-label="Project sections">
      {sections.map((section) => {
        const href = section.href(projectId);
        const isActive =
          section.id === "overview"
            ? pathname === projectBase
            : pathname.startsWith(href);

        return (
          <Link
            key={section.id}
            href={href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
