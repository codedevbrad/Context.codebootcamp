"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useProjectWritings } from "@/domains/projects/writing/_swr/useProjectWritings";
import type { ProjectWritingListItem } from "@/domains/projects/writing/db";

type ProjectFilesAccordionProps = {
  projectSlug: string;
  pathname: string;
};

type SidebarWritingItem = Omit<ProjectWritingListItem, "createdAt" | "updatedAt" | "stamped"> & {
  createdAt: Date | string;
  updatedAt: Date | string;
  stamped: Date | string;
};

function toTimestamp(value: Date | string) {
  return new Date(value).getTime();
}

const FILES_PER_PAGE = 5;

export function ProjectFilesAccordion({ projectSlug, pathname }: ProjectFilesAccordionProps) {
  const { writings, isLoading, createWriting } = useProjectWritings(projectSlug);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const sortedWritings = useMemo(
    () =>
      [...(writings as SidebarWritingItem[])].sort(
        (a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt)
      ),
    [writings]
  );

  const totalPages = Math.max(1, Math.ceil(sortedWritings.length / FILES_PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  const visibleWritings = useMemo(() => {
    const start = (currentPage - 1) * FILES_PER_PAGE;
    return sortedWritings.slice(start, start + FILES_PER_PAGE);
  }, [currentPage, sortedWritings]);

  const handleCreateFile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createWriting(newTitle);

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (!result.data) {
        setError("Unable to create file");
        return;
      }

      const createdWriting = result.data;
      setNewTitle("");
      setIsCreateOpen(false);
      setPage(1);
      router.push(`/my/project/${projectSlug}/files/${createdWriting.slug}`);
      router.refresh();
    });
  };

  return (
    <Accordion type="single" collapsible className="mt-2">
      <AccordionItem value={`files-${projectSlug}`} className="border-none">
        <AccordionTrigger className="rounded px-2 py-1 text-xs text-muted-foreground hover:no-underline cursor-pointer hover:bg-gray-200">
          <span>Files [{sortedWritings.length}]</span>
        </AccordionTrigger>
        <AccordionContent className="pb-0">
          {error ? (
            <p className="mx-2 mb-2 rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
              {error}
            </p>
          ) : null}
          {isLoading ? (
            <p className="px-2 pb-2 text-xs text-muted-foreground">Loading files...</p>
          ) : sortedWritings.length === 0 ? (
            <p className="px-2 pb-2 text-xs text-muted-foreground">No files yet.</p>
          ) : (
            <ul className="space-y-1 px-2 pb-1">
              {visibleWritings.map((writing) => {
                const fileHref = `/my/project/${projectSlug}/files/${writing.slug}`;
                const isFileActive = pathname === fileHref;

                return (
                  <li key={writing.id}>
                    <Link
                      href={fileHref}
                      className={`block truncate rounded px-2 py-1 text-xs transition-colors ${
                        isFileActive ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
                      }`}
                      title={writing.title}
                    >
                      {writing.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {!isLoading && sortedWritings.length > FILES_PER_PAGE ? (
            <div className="flex items-center justify-between px-2 pb-2 text-xs text-muted-foreground">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  disabled={currentPage === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Prev
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}

          <div className="px-2 pb-2">
            <Popover open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full justify-start text-xs"
                >
                  <Plus className="size-3.5" />
                  New File
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <PopoverHeader>
                  <PopoverTitle>Create File</PopoverTitle>
                  <PopoverDescription>
                    Add a new writing file linked to this project.
                  </PopoverDescription>
                </PopoverHeader>
                <form onSubmit={handleCreateFile} className="mt-3 space-y-2">
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="File title"
                    disabled={isPending}
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreateOpen(false)}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={isPending}>
                      {isPending ? "Saving..." : "Create"}
                    </Button>
                  </div>
                </form>
              </PopoverContent>
            </Popover>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
