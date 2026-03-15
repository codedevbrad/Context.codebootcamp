"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
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
import { useProjectContexts } from "@/domains/projects/project/_swr/useProjectContexts";
import {
  deleteProjectContextAction,
  updateProjectContextAction,
  type ProjectContextListItem,
} from "@/domains/projects/project/db";

type ProjectContextsListProps = {
  projectSlug: string;
  initialContexts: ProjectContextListItem[];
};

type ContextItem = Omit<ProjectContextListItem, "createdAt" | "updatedAt"> & {
  createdAt: Date | string;
  updatedAt: Date | string;
};

function toTimestamp(value: Date | string) {
  return new Date(value).getTime();
}

export function ProjectContextsList({ projectSlug, initialContexts }: ProjectContextsListProps) {
  const { contexts, mutate } = useProjectContexts(projectSlug, initialContexts);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [deletingContext, setDeletingContext] = useState<ContextItem | null>(null);

  const sortedContexts = useMemo(
    () =>
      [...(contexts as ContextItem[])].sort(
        (a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt)
      ),
    [contexts]
  );

  const startEdit = (context: ContextItem) => {
    setError("");
    setEditingId(context.id);
    setEditName(context.name);
    setEditDescription(context.description);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  const saveEdit = (e: React.FormEvent<HTMLFormElement>, contextRef: string) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await updateProjectContextAction(
        projectSlug,
        contextRef,
        editName,
        editDescription
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (!result.data) {
        setError("Unable to update context");
        return;
      }

      const updatedContext = result.data;
      await mutate(
        (prev) =>
          (prev ?? []).map((context) =>
            context.id === contextRef || context.slug === contextRef ? updatedContext : context
          ),
        { revalidate: false }
      );
      cancelEdit();
    });
  };

  const confirmDelete = () => {
    if (!deletingContext) {
      return;
    }

    startTransition(async () => {
      const deletingRef = deletingContext.slug ?? deletingContext.id;
      const result = await deleteProjectContextAction(projectSlug, deletingRef);

      if (!result.success) {
        setError(result.error);
        return;
      }

      await mutate(
        (prev) =>
          (prev ?? []).filter(
            (context) => context.id !== deletingRef && context.slug !== deletingRef
          ),
        {
          revalidate: false,
        }
      );
      setDeletingContext(null);
    });
  };

  return (
    <section className="rounded-md border p-4">
      <h2 className="text-lg font-medium">Contexts</h2>
      <p className="mb-3 text-sm text-muted-foreground">Contexts linked to this project.</p>

      {error ? (
        <p className="mb-3 rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>
      ) : null}

      {sortedContexts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No contexts linked yet. Add one from the project sidebar.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {sortedContexts.map((context) => {
            const isEditingThis = editingId === context.id;
            const contextRef = context.slug ?? context.id;

            return (
              <li key={context.id} className="group relative rounded-xl border p-3">
                <div
                  className={`absolute top-2 right-2 z-10 flex items-center gap-1 transition-opacity ${
                    isEditingThis
                      ? "opacity-100"
                      : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100"
                  }`}
                >
                  <Popover
                    open={isEditingThis}
                    onOpenChange={(open) => {
                      if (open) {
                        startEdit(context);
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
                        aria-label={`Edit ${context.name}`}
                        disabled={isPending}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-80">
                      <PopoverHeader>
                        <PopoverTitle>Edit Context</PopoverTitle>
                        <PopoverDescription>
                          Update this context name and description.
                        </PopoverDescription>
                      </PopoverHeader>
                      <form onSubmit={(e) => saveEdit(e, contextRef)} className="mt-3 space-y-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          disabled={isPending}
                          placeholder="Context name"
                        />
                        <Input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          disabled={isPending}
                          placeholder="Context description"
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
                    aria-label={`Delete ${context.name}`}
                    onClick={() => {
                      setError("");
                      setDeletingContext(context);
                    }}
                    disabled={isPending}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                <Link
                  href={`/my/project/${projectSlug}/contexts/context/${contextRef}`}
                  className="block pr-14"
                >
                  <p className="font-medium whitespace-normal wrap-break-word">{context.name}</p>
                  <p className="text-sm text-muted-foreground whitespace-normal wrap-break-word">
                    {context.description}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmModal
        open={Boolean(deletingContext)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingContext(null);
          }
        }}
        title="Delete context?"
        description={
          deletingContext
            ? `This will remove "${deletingContext.name}" from this project.`
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
