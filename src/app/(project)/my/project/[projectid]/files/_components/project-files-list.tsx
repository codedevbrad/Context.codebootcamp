"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/custom/confirm-modal";
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
import {
  type ProjectWritingListItem,
} from "@/domains/projects/writing/db";
import { useProjectWritings } from "@/domains/projects/writing/_swr/useProjectWritings";

type ProjectFilesListProps = {
  projectId: string;
  initialWritings: ProjectWritingListItem[];
};

type WritingItem = Omit<ProjectWritingListItem, "createdAt" | "updatedAt" | "stamped"> & {
  createdAt: Date | string;
  updatedAt: Date | string;
  stamped: Date | string;
};

function toTimestamp(value: Date | string) {
  return new Date(value).getTime();
}

export function ProjectFilesList({ projectId, initialWritings }: ProjectFilesListProps) {
  const router = useRouter();
  const { writings, createWriting, updateWritingTitle, deleteWriting } = useProjectWritings(
    projectId,
    initialWritings
  );
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [newTitle, setNewTitle] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deletingWriting, setDeletingWriting] = useState<WritingItem | null>(null);

  const sortedWritings = useMemo(
    () =>
      [...writings].sort(
        (a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt)
      ),
    [writings]
  );

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createWriting(newTitle);

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (!result.data) {
        setError("Unable to create writing file");
        return;
      }

      const createdWriting = result.data;
      setNewTitle("");
      setIsCreateOpen(false);
      router.push(`/my/project/${projectId}/files/${createdWriting.id}`);
      router.refresh();
    });
  };

  const startEdit = (writing: WritingItem) => {
    setError("");
    setEditingId(writing.id);
    setEditTitle(writing.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const saveEdit = (e: React.FormEvent<HTMLFormElement>, writingId: string) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await updateWritingTitle(writingId, editTitle);

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (!result.data) {
        setError("Unable to update writing file");
        return;
      }

      cancelEdit();
      router.refresh();
    });
  };

  const confirmDelete = () => {
    if (!deletingWriting) {
      return;
    }

    startTransition(async () => {
      const deletingId = deletingWriting.id;
      const result = await deleteWriting(deletingId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setDeletingWriting(null);
      router.refresh();
    });
  };

  return (
    <section className="rounded-md border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-medium">Writing Files</h2>
        <Popover open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="size-4" />
              New File
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <PopoverHeader>
              <PopoverTitle>Create Writing File</PopoverTitle>
              <PopoverDescription>
                Create a writing file for this project.
              </PopoverDescription>
            </PopoverHeader>
            <form onSubmit={handleCreate} className="mt-3 space-y-2">
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

      {error ? (
        <p className="mb-3 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {sortedWritings.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No writing files yet. Create one from the New File button.
        </p>
      ) : (
        <ul className="grid grid-cols-5 gap-2">
          {sortedWritings.map((writing) => {
            const isEditingThis = editingId === writing.id;

            return (
              <li key={writing.id} className="group rounded-lg border p-2">
                <div className="flex items-start gap-2">
                  <Link
                    href={`/my/project/${projectId}/files/${writing.id}`}
                    className="min-w-0 flex-1 rounded px-2 py-1"
                  >
                    <p className="truncate font-medium">{writing.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Updated {new Date(writing.updatedAt).toLocaleString()}
                    </p>
                  </Link>

                  <div
                    className={`flex items-center gap-1 transition-opacity ${
                      isEditingThis
                        ? "opacity-100"
                        : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100"
                    }`}
                  >
                    <Popover
                      open={isEditingThis}
                      onOpenChange={(open) => {
                        if (open) {
                          startEdit(writing);
                        } else if (isEditingThis) {
                          cancelEdit();
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="outline"
                          aria-label={`Edit ${writing.title}`}
                          disabled={isPending}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-80">
                        <PopoverHeader>
                          <PopoverTitle>Rename File</PopoverTitle>
                          <PopoverDescription>Update this writing file title.</PopoverDescription>
                        </PopoverHeader>
                        <form
                          onSubmit={(e) => saveEdit(e, writing.id)}
                          className="mt-3 space-y-2"
                        >
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            disabled={isPending}
                            placeholder="File title"
                          />
                          <div className="flex justify-end gap-2 pt-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={cancelEdit}
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
                      size="icon-xs"
                      variant="destructive"
                      aria-label={`Delete ${writing.title}`}
                      onClick={() => {
                        setError("");
                        setDeletingWriting(writing);
                      }}
                      disabled={isPending}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmModal
        open={Boolean(deletingWriting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingWriting(null);
          }
        }}
        title="Delete writing file?"
        description={
          deletingWriting
            ? `This will permanently remove "${deletingWriting.title}".`
            : undefined
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isPending={isPending}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
