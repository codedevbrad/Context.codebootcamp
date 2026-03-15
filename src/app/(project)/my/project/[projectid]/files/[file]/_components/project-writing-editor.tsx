"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, Plus, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/custom/confirm-modal";
import TipTapEditor from "@/components/tiptap";
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
import { type ProjectWritingDetails } from "@/domains/projects/writing/db";
import { toProjectWritingContentV2 } from "@/domains/projects/writing/content";
import { useProjectWriting } from "@/domains/projects/writing/_swr/useProjectWriting";

const EMPTY_TIPTAP_DOC = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function normalizeTiptapContent(content: unknown) {
  try {
    const cloned = JSON.parse(JSON.stringify(content));
    if (cloned && typeof cloned === "object" && !Array.isArray(cloned)) {
      return cloned;
    }
  } catch {
    return EMPTY_TIPTAP_DOC;
  }

  return EMPTY_TIPTAP_DOC;
}

type ProjectWritingEditorProps = {
  projectSlug: string;
  writingRef: string;
  initialWriting: ProjectWritingDetails;
};

export function ProjectWritingEditor({
  projectSlug,
  writingRef,
  initialWriting,
}: ProjectWritingEditorProps) {
  const router = useRouter();
  const {
    writing,
    isLoading,
    setActivePage,
    addPage,
    renamePage,
    deletePage,
    updatePageContent,
    deleteWriting: removeWriting,
  } = useProjectWriting(projectSlug, writingRef, initialWriting);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [pageToDeleteId, setPageToDeleteId] = useState<string | null>(null);
  const [isCreatePageOpen, setIsCreatePageOpen] = useState(false);
  const [isRenamePageOpen, setIsRenamePageOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [renamePageTitle, setRenamePageTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  const writingContent = useMemo(
    () => toProjectWritingContentV2(writing?.content ?? EMPTY_TIPTAP_DOC),
    [writing?.content]
  );
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const resolvedActivePageId =
    activePageId && writingContent.pages.some((page) => page.id === activePageId)
      ? activePageId
      : writingContent.activePageId;

  const activePage =
    writingContent.pages.find((page) => page.id === resolvedActivePageId) ?? writingContent.pages[0];

  const handleDeleteWriting = () => {
    startTransition(async () => {
      const result = await removeWriting();
      if (!result.success) {
        setError(result.error);
        return;
      }

      setIsDeleting(false);
      router.push(`/my/project/${projectSlug}/files`);
      router.refresh();
    });
  };

  const handleCreatePage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await addPage(newPageTitle);
      if (!result.success) {
        setError(result.error);
        return;
      }

      if (result.data) {
        const nextContent = toProjectWritingContentV2(result.data.content);
        setActivePageId(nextContent.activePageId);
      }

      setNewPageTitle("");
      setIsCreatePageOpen(false);
    });
  };

  const handleRenamePage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await renamePage(activePage.id, renamePageTitle);
      if (!result.success) {
        setError(result.error);
        return;
      }

      setIsRenamePageOpen(false);
      setRenamePageTitle("");
    });
  };

  const handleDeletePage = () => {
    if (!pageToDeleteId) {
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await deletePage(pageToDeleteId);
      if (!result.success) {
        setError(result.error);
        return;
      }

      if (result.data) {
        const nextContent = toProjectWritingContentV2(result.data.content);
        setActivePageId(nextContent.activePageId);
      }
      setIsRenamePageOpen(false);
      setPageToDeleteId(null);
    });
  };

  const handleSelectPage = (pageId: string) => {
    if (pageId === resolvedActivePageId) {
      return;
    }

    setActivePageId(pageId);
    setIsRenamePageOpen(false);
    startTransition(async () => {
      const result = await setActivePage(pageId);
      if (!result.success) {
        setError(result.error);
      }
    });
  };

  if (isLoading && !writing) {
    return (
      <section className="space-y-3 rounded-md border p-4">
        <p className="text-sm text-muted-foreground">Loading writing file...</p>
      </section>
    );
  }

  if (!writing) {
    return (
      <section className="space-y-3 rounded-md border p-4">
        <p className="text-sm text-muted-foreground">Writing file not found.</p>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col gap-3 overflow-hidden rounded-md border p-4">
      {error ? (
        <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>
      ) : null}
      

      <div className="flex shrink-0 items-center justify-between gap-2 rounded-md border p-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          {writingContent.pages.map((page) => {
            const isActive = page.id === activePage.id;

            return (
              <Button
                key={page.id}
                type="button"
                size="sm"
                variant={isActive ? "default" : "outline"}
                onClick={() => handleSelectPage(page.id)}
                className="max-w-56"
                disabled={isPending}
              >
                <span className="truncate">{page.title}</span>
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Popover open={isRenamePageOpen} onOpenChange={setIsRenamePageOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => setRenamePageTitle(activePage.title)}
              >
                <PencilIcon className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <PopoverHeader>
                <PopoverTitle>Rename page</PopoverTitle>
                <PopoverDescription>Update the active page title.</PopoverDescription>
              </PopoverHeader>
              <form onSubmit={handleRenamePage} className="mt-3 space-y-2">
                <Input
                  value={renamePageTitle}
                  onChange={(e) => setRenamePageTitle(e.target.value)}
                  disabled={isPending}
                  placeholder="Page title"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsRenamePageOpen(false);
                      setRenamePageTitle("");
                    }}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isPending}>
                    {isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={isPending || writingContent.pages.length <= 1}
            onClick={() => setPageToDeleteId(activePage.id)}
          >
            <Trash2 className="size-4" />
          </Button>

          <Popover open={isCreatePageOpen} onOpenChange={setIsCreatePageOpen}>
            <PopoverTrigger asChild>
              <Button type="button" size="sm" variant="outline" disabled={isPending}>
                <Plus className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <PopoverHeader>
                <PopoverTitle>Create Page</PopoverTitle>
                <PopoverDescription>Add a new page to this file.</PopoverDescription>
              </PopoverHeader>
              <form onSubmit={handleCreatePage} className="mt-3 space-y-2">
                <Input
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="Page title (optional)"
                  disabled={isPending}
                />
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreatePageOpen(false)}
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
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <TipTapEditor
          key={activePage.id}
          initialContent={normalizeTiptapContent(activePage.content)}
          onUpdate={() => {
            setError("");
          }}
          onDebouncedUpdate={async (json) => {
            const safeJson = normalizeTiptapContent(json);
            const result = await updatePageContent(activePage.id, safeJson);
            if (!result.success) {
              setError(result.error);
            } else {
              setError("");
            }

            return result;
          }}
          updateDebounceMs={700}
          showSaveStatus
        />
      </div>

      <ConfirmModal
        open={isDeleting}
        onOpenChange={setIsDeleting}
        title="Delete writing file?"
        description="This will permanently remove this writing file."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isPending={isPending}
        onConfirm={handleDeleteWriting}
      />

      <ConfirmModal
        open={Boolean(pageToDeleteId)}
        onOpenChange={(open) => {
          if (!open) {
            setPageToDeleteId(null);
          }
        }}
        title="Delete page?"
        description="This will permanently remove this page."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isPending={isPending}
        onConfirm={handleDeletePage}
      />
    </section>
  );
}
