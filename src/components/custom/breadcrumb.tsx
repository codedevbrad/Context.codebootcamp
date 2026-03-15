"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useMemo } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export type AppBreadcrumbItem = {
  label: string;
  href?: string;
};

type AppBreadcrumbProps = {
  items?: AppBreadcrumbItem[];
  className?: string;
};

const STATIC_LABELS: Record<string, string> = {
  my: "My",
  project: "Projects",
  projects: "Projects",
  group: "Groups",
  context: "Contexts",
  files: "Files",
  tasks: "Tasks",
  erm: "ERM",
};

const DYNAMIC_LABEL_BY_PARENT: Record<string, string> = {
  project: "Project",
  projects: "Project",
  group: "Group",
  context: "Context",
  files: "File",
};

function formatSegment(segment: string) {
  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildHrefForSegment(segments: string[], index: number) {
  const segment = segments[index];
  const defaultHref = `/${segments.slice(0, index + 1).join("/")}`;

  // Route uses singular "project" but breadcrumb target should be project list.
  if (segment === "project") {
    return segments[0] === "my" ? "/my/projects" : "/projects";
  }

  return defaultHref;
}

function buildItemsFromPath(pathname: string): AppBreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);

  return segments.map((segment, index) => {
    const previousSegment = segments[index - 1];
    const label =
      DYNAMIC_LABEL_BY_PARENT[previousSegment] ||
      STATIC_LABELS[segment] ||
      formatSegment(segment);

    const href = buildHrefForSegment(segments, index);
    const isLast = index === segments.length - 1;

    return {
      label,
      href: isLast ? undefined : href,
    };
  });
}

export function AppBreadcrumb({ items, className }: AppBreadcrumbProps) {
  const pathname = usePathname();

  const resolvedItems = useMemo(() => {
    if (items?.length) {
      return items;
    }

    if (!pathname) {
      return [];
    }

    return buildItemsFromPath(pathname);
  }, [items, pathname]);

  if (!resolvedItems.length) {
    return null;
  }

  return (
    <Breadcrumb className={cn("px-1", className)}>
      <BreadcrumbList>
        {resolvedItems.map((item, index) => {
          const isLast = index === resolvedItems.length - 1;

          return (
            <Fragment key={`${item.label}-${item.href ?? index}`}>
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {!isLast ? <BreadcrumbSeparator /> : null}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
