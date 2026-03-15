"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type ProjectSubnavProps = {
  projectSlug: string;
};

const sections = [
  { id: "overview", label: "Overview", href: (projectSlug: string) => `/my/project/${projectSlug}` },
  { id: "files", label: "Files", href: (projectSlug: string) => `/my/project/${projectSlug}/files` },
  { id: "contexts", label: "Contexts", href: (projectSlug: string) => `/my/project/${projectSlug}/contexts` },
  { id: "tasks", label: "Tasks", href: (projectSlug: string) => `/my/project/${projectSlug}/tasks` },
  { id: "erm", label: "ERM", href: (projectSlug: string) => `/my/project/${projectSlug}/erm` },
];

export default function ProjectSubnav({ projectSlug }: ProjectSubnavProps) {
  const pathname = usePathname();
  const projectBase = `/my/project/${projectSlug}`;

  return (
    <nav className="flex items-center gap-2 border-b pb-3" aria-label="Project sections">
      {sections.map((section) => {
        const href = section.href(projectSlug);
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
