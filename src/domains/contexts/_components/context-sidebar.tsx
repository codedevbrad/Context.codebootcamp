"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  createContextGroupAction,
  deleteContextGroupAction,
  updateContextGroupAction,
  type ContextGroupListItem,
} from "@/domains/contexts/db";

type ContextSidebarProps = {
  initialGroups: ContextGroupListItem[];
};

type SidebarGroupItem = Omit<ContextGroupListItem, "createdAt" | "updatedAt"> & {
  createdAt: Date | string;
  updatedAt: Date | string;
};

function toTimestamp(value: Date | string) {
  return new Date(value).getTime();
}

export function ContextSidebar({ initialGroups }: ContextSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [groups, setGroups] = useState<SidebarGroupItem[]>(initialGroups);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [deletingGroup, setDeletingGroup] = useState<SidebarGroupItem | null>(null);

  const sortedGroups = useMemo(
    () =>
      [...groups].sort(
        (a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt)
      ),
    [groups]
  );

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createContextGroupAction(newName, newDescription);

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (!result.data) {
        setError("Unable to create context");
        return;
      }

      const createdGroup = result.data;
      setGroups((prev) => [createdGroup, ...prev]);
      setNewName("");
      setNewDescription("");
      setIsCreateOpen(false);
      router.push(`/my/group/${createdGroup.id}`);
      router.refresh();
    });
  };

  const startEdit = (group: SidebarGroupItem) => {
    setError("");
    setEditingId(group.id);
    setEditName(group.name);
    setEditDescription(group.description);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  const saveEdit = (e: React.FormEvent<HTMLFormElement>, groupId: string) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await updateContextGroupAction(groupId, editName, editDescription);

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (!result.data) {
        setError("Unable to update context");
        return;
      }

      const updated = result.data;
      setGroups((prev) =>
        prev.map((group) => (group.id === groupId ? updated : group))
      );
      cancelEdit();
      router.refresh();
    });
  };

  const requestDelete = (group: SidebarGroupItem) => {
    setError("");
    setDeletingGroup(group);
  };

  const confirmDelete = () => {
    if (!deletingGroup) {
      return;
    }

    startTransition(async () => {
      const deletingId = deletingGroup.id;
      const result = await deleteContextGroupAction(deletingId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setDeletingGroup(null);
      setGroups((prev) => prev.filter((group) => group.id !== deletingId));
      if (pathname === `/my/group/${deletingId}`) {
        router.push("/my");
      }
      router.refresh();
    });
  };

  return (
    <aside className="h-full w-full max-w-xs shrink-0 pr-4 md:max-w-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="mr-3 text-lg font-semibold">Context Groups</h2>
          <Popover open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="size-4" />
                New
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <PopoverHeader>
                <PopoverTitle>Create Group</PopoverTitle>
                <PopoverDescription>
                  Add a context group that will appear in your sidebar.
                </PopoverDescription>
              </PopoverHeader>
              <form onSubmit={handleCreate} className="mt-3 space-y-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Group name"
                  disabled={isPending}
                />
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Group description"
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
          <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="space-y-2">
          {sortedGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No context groups yet. Create one from the New button.
            </p>
          ) : (
            sortedGroups.map((group) => {
              const href = `/my/group/${group.id}`;
              const isActive = pathname === href;
              const isEditingThis = editingId === group.id;

              return (
                <div
                  key={group.id}
                  className={`group rounded-md border border-border p-2 transition-colors ${
                    isActive ? "border-primary/40 bg-accent/30" : "hover:bg-accent/20"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Link href={href} className="min-w-0 flex-1 rounded px-2 py-1 text-sm">
                      <p className="truncate font-medium">{group.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {group.description}
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
                            startEdit(group);
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
                            aria-label={`Edit ${group.name}`}
                            disabled={isPending}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-80">
                          <PopoverHeader>
                            <PopoverTitle>Edit Group</PopoverTitle>
                            <PopoverDescription>
                              Update this group name and description.
                            </PopoverDescription>
                          </PopoverHeader>
                          <form
                            onSubmit={(e) => saveEdit(e, group.id)}
                            className="mt-3 space-y-2"
                          >
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              disabled={isPending}
                              placeholder="Group name"
                            />
                            <Input
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              disabled={isPending}
                              placeholder="Group description"
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
                        aria-label={`Delete ${group.name}`}
                        onClick={() => requestDelete(group)}
                        disabled={isPending}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <ConfirmModal
        open={Boolean(deletingGroup)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingGroup(null);
          }
        }}
        title="Delete context group?"
        description={
          deletingGroup
            ? `This will permanently remove "${deletingGroup.name}" and unlink its contexts.`
            : undefined
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isPending={isPending}
        onConfirm={confirmDelete}
      />
    </aside>
  );
}
