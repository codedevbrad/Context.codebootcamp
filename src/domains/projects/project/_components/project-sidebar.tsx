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
import { useProjects } from "@/domains/projects/project/_swr/useProjects";
import type { ProjectListItem } from "@/domains/projects/project/db";

type ProjectSidebarProps = {
  initialProjects: ProjectListItem[];
};

type SidebarProjectItem = Omit<ProjectListItem, "createdAt" | "updatedAt"> & {
  createdAt: Date | string;
  updatedAt: Date | string;
};

function toTimestamp(value: Date | string) {
  return new Date(value).getTime();
}

export function ProjectSidebar({ initialProjects }: ProjectSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [deletingProject, setDeletingProject] = useState<SidebarProjectItem | null>(null);

  const { projects, createProject, updateProject, deleteProject } =
    useProjects(initialProjects);

  const sortedProjects = useMemo(
    () =>
      [...(projects as SidebarProjectItem[])].sort(
        (a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt)
      ),
    [projects]
  );

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createProject(newName, newDescription);

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (!result.data) {
        setError("Unable to create project");
        return;
      }

      const createdProject = result.data;
      setNewName("");
      setNewDescription("");
      setIsCreateOpen(false);
      router.push(`/my/project/${createdProject.id}`);
      router.refresh();
    });
  };

  const startEdit = (project: SidebarProjectItem) => {
    setError("");
    setEditingId(project.id);
    setEditName(project.name);
    setEditDescription(project.description);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  const saveEdit = (e: React.FormEvent<HTMLFormElement>, projectId: string) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await updateProject(projectId, editName, editDescription);

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (!result.data) {
        setError("Unable to update project");
        return;
      }

      cancelEdit();
      router.refresh();
    });
  };

  const requestDelete = (project: SidebarProjectItem) => {
    setError("");
    setDeletingProject(project);
  };

  const confirmDelete = () => {
    if (!deletingProject) {
      return;
    }

    startTransition(async () => {
      const deletingId = deletingProject.id;
      const result = await deleteProject(deletingId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setDeletingProject(null);
      if (pathname === `/my/project/${deletingId}`) {
        router.push("/my");
      }
      router.refresh();
    });
  };

  return (
    <aside className="h-full w-full max-w-xs shrink-0 pr-4 md:max-w-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="mr-3 text-lg font-semibold">Projects</h2>
          <Popover open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="size-4" />
                New
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <PopoverHeader>
                <PopoverTitle>Create Project</PopoverTitle>
                <PopoverDescription>
                  Add a project that will appear in your sidebar.
                </PopoverDescription>
              </PopoverHeader>
              <form onSubmit={handleCreate} className="mt-3 space-y-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Project name"
                  disabled={isPending}
                />
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Project description"
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
          {sortedProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No projects yet. Create one from the New button.
            </p>
          ) : (
            sortedProjects.map((project) => {
              const href = `/my/project/${project.id}`;
              const isActive = pathname === href;
              const isEditingThis = editingId === project.id;

              return (
                <div
                  key={project.id}
                  className={`group rounded-md border border-border p-2 transition-colors ${
                    isActive ? "border-primary/40 bg-accent/30" : "hover:bg-accent/20"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Link href={href} className="min-w-0 flex-1 rounded px-2 py-1 text-sm">
                      <p className="truncate font-medium">{project.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {project.description}
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
                            startEdit(project);
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
                            aria-label={`Edit ${project.name}`}
                            disabled={isPending}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-80">
                          <PopoverHeader>
                            <PopoverTitle>Edit Project</PopoverTitle>
                            <PopoverDescription>
                              Update this project name and description.
                            </PopoverDescription>
                          </PopoverHeader>
                          <form
                            onSubmit={(e) => saveEdit(e, project.id)}
                            className="mt-3 space-y-2"
                          >
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              disabled={isPending}
                              placeholder="Project name"
                            />
                            <Input
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              disabled={isPending}
                              placeholder="Project description"
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
                        aria-label={`Delete ${project.name}`}
                        onClick={() => requestDelete(project)}
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
        open={Boolean(deletingProject)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingProject(null);
          }
        }}
        title="Delete project?"
        description={
          deletingProject
            ? `This will permanently remove "${deletingProject.name}".`
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
