"use client";

import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/kibo-ui/kanban";
import { Clipboard, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, useSyncExternalStore, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ConfirmModal } from "@/components/custom/confirm-modal";
import { HorizontalScrollControls } from "@/components/custom/horizontal-scroll-controls";
import {
  createGanttTaskAction,
  createProjectGanttDomainAction,
  deleteGanttTaskAction,
  deleteProjectGanttDomainAction,
  type CategoryOption,
  type GanttColumnType,
  type GanttTaskItem,
  type ProjectGanttDomainItem,
  updateGanttTaskAction,
  updateProjectGanttDomainAction,
} from "@/domains/projects/project/db";
import { CategoryPickerCreator } from "@/domains/projects/gantt/_components/category-picker-creator";
import { Textarea } from "@/components/ui/textarea";

type ColumnId = "planned" | "in_progress" | "done";
type Column = {
  id: ColumnId;
  name: string;
  color: string;
};

const columns: Column[] = [
  { id: "planned", name: "Planned", color: "#6B7280" },
  { id: "in_progress", name: "In Progress", color: "#F59E0B" },
  { id: "done", name: "Done", color: "#10B981" },
];

type KanbanTasksProps = {
  projectId: string;
  initialDomains: ProjectGanttDomainItem[];
  initialCategories: CategoryOption[];
};

type Task = {
  id: string;
  name: string;
  description: string;
  column: ColumnId;
  pageData: unknown;
  position: number;
  categoryId: string;
  categoryName: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type DomainBoard = {
  id: string;
  name: string;
  description: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  tasks: Task[];
};

type EditingTaskState = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  newCategoryName: string;
};

function getColumnFromPageData(value: unknown): ColumnId {
  const validColumnIds = new Set<ColumnId>(columns.map((col) => col.id));
  if (!value || typeof value !== "object") {
    return "planned";
  }

  const maybeColumn = (value as { column?: unknown }).column;
  if (typeof maybeColumn !== "string" || !validColumnIds.has(maybeColumn as ColumnId)) {
    return "planned";
  }

  return maybeColumn as ColumnId;
}

function columnIdToGanttColumnType(column: ColumnId): GanttColumnType {
  switch (column) {
    case "planned":
      return "PLANNED";
    case "in_progress":
      return "IN_PROGRESS";
    case "done":
      return "DONE";
  }
}

function ganttColumnTypeToColumnId(columnType: GanttColumnType): ColumnId {
  switch (columnType) {
    case "PLANNED":
      return "planned";
    case "IN_PROGRESS":
      return "in_progress";
    case "DONE":
      return "done";
  }
}

function normalizeTask(task: GanttTaskItem): Task {
  return {
    id: task.id,
    name: task.name,
    description: task.description,
    column: task.ganttcolumnType
      ? ganttColumnTypeToColumnId(task.ganttcolumnType)
      : getColumnFromPageData(task.pageData),
    pageData: task.pageData,
    position: task.position,
    categoryId: task.categoryId,
    categoryName: task.category.name,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function normalizeDomains(value: ProjectGanttDomainItem[]): DomainBoard[] {
  return value.map((domain) => ({
    id: domain.id,
    name: domain.name,
    description: domain.description,
    createdAt: domain.createdAt,
    updatedAt: domain.updatedAt,
    tasks: domain.tasks.map(normalizeTask),
  }));
}

function byUpdatedAtDesc<T extends { updatedAt: Date | string }>(items: T[]) {
  return [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export default function KanbanTasks({
  projectId,
  initialDomains,
  initialCategories,
}: KanbanTasksProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [domains, setDomains] = useState<DomainBoard[]>(() => normalizeDomains(initialDomains));
  const [categories, setCategories] = useState<CategoryOption[]>(initialCategories);
  const sortedDomains = useMemo(() => byUpdatedAtDesc(domains), [domains]);
  const [selectedDomainId, setSelectedDomainId] = useState<string>(sortedDomains[0]?.id ?? "");

  const selectedDomain = useMemo(
    () => domains.find((domain) => domain.id === selectedDomainId) ?? null,
    [domains, selectedDomainId]
  );

  const tasks = useMemo(() => selectedDomain?.tasks ?? [], [selectedDomain]);

  const [newDomainName, setNewDomainName] = useState("");
  const [newDomainDescription, setNewDomainDescription] = useState("");
  const [isCreateDomainOpen, setIsCreateDomainOpen] = useState(false);
  const [editingDomainId, setEditingDomainId] = useState<string | null>(null);
  const [editDomainName, setEditDomainName] = useState("");
  const [editDomainDescription, setEditDomainDescription] = useState("");
  const [deletingDomainId, setDeletingDomainId] = useState<string | null>(null);

  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskCategoryId, setNewTaskCategoryId] = useState("");
  const [newTaskCategoryName, setNewTaskCategoryName] = useState("");
  const [createTaskColumn, setCreateTaskColumn] = useState<ColumnId | null>(null);
  const [activeCategoryFilterId, setActiveCategoryFilterId] = useState<string>("all");
  const [editingTask, setEditingTask] = useState<EditingTaskState | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const filteredTasks = useMemo(() => {
    if (activeCategoryFilterId === "all") {
      return tasks;
    }
    return tasks.filter((task) => task.categoryId === activeCategoryFilterId);
  }, [tasks, activeCategoryFilterId]);
  const taskCountByColumn = useMemo(() => {
    const counts: Record<ColumnId, number> = {
      planned: 0,
      in_progress: 0,
      done: 0,
    };

    filteredTasks.forEach((task) => {
      counts[task.column] += 1;
    });

    return counts;
  }, [filteredTasks]);

  const setDomainTasks = (domainId: string, nextTasks: Task[]) => {
    setDomains((prev) =>
      prev.map((domain) => (domain.id === domainId ? { ...domain, tasks: nextTasks } : domain))
    );
  };

  const upsertCategory = (category: CategoryOption) => {
    setCategories((prev) => {
      const exists = prev.some((item) => item.id === category.id);
      if (exists) {
        return prev.map((item) => (item.id === category.id ? category : item));
      }
      return [...prev, category].sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  const handleCreateDomain = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createProjectGanttDomainAction(
        projectId,
        newDomainName,
        newDomainDescription
      );
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (!result.data) {
        setError("Failed to create gantt domain");
        return;
      }

      const createdDomain: DomainBoard = {
        ...result.data,
        tasks: result.data.tasks.map(normalizeTask),
      };
      setDomains((prev) => [createdDomain, ...prev]);
      setSelectedDomainId(createdDomain.id);
      setNewDomainName("");
      setNewDomainDescription("");
      setIsCreateDomainOpen(false);
    });
  };

  const handleUpdateDomain = (event: FormEvent<HTMLFormElement>, domainId: string) => {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await updateProjectGanttDomainAction(
        projectId,
        domainId,
        editDomainName,
        editDomainDescription
      );
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (!result.data) {
        setError("Failed to update gantt domain");
        return;
      }

      const updatedDomain: DomainBoard = {
        ...result.data,
        tasks: result.data.tasks.map(normalizeTask),
      };
      setDomains((prev) => prev.map((domain) => (domain.id === domainId ? updatedDomain : domain)));
      setEditingDomainId(null);
      setEditDomainName("");
      setEditDomainDescription("");
    });
  };

  const handleDeleteDomain = () => {
    if (!deletingDomainId) {
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await deleteProjectGanttDomainAction(projectId, deletingDomainId);
      if (!result.success) {
        setError(result.error);
        return;
      }

      setDomains((prev) => {
        const remaining = prev.filter((domain) => domain.id !== deletingDomainId);
        if (selectedDomainId === deletingDomainId) {
          setSelectedDomainId(byUpdatedAtDesc(remaining)[0]?.id ?? "");
        }
        return remaining;
      });
      setDeletingDomainId(null);
    });
  };

  const handleCreateTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDomain) {
      setError("Select or create a domain first");
      return;
    }
    if (!createTaskColumn) {
      setError("Choose a column before creating a task");
      return;
    }

    const trimmedName = newTaskName.trim();
    const trimmedDescription = newTaskDescription.trim();
    if (!trimmedName) {
      setError("Task name is required");
      return;
    }
    if (!trimmedDescription) {
      setError("Task description is required");
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await createGanttTaskAction({
        projectId,
        domainId: selectedDomain.id,
        name: trimmedName,
        description: trimmedDescription,
        pageData: { column: createTaskColumn },
        ganttcolumnType: columnIdToGanttColumnType(createTaskColumn),
        categoryId: newTaskCategoryId || undefined,
        newCategoryName: newTaskCategoryName,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }
      if (!result.data) {
        setError("Failed to create gantt task");
        return;
      }

      const createdTask = normalizeTask(result.data);
      setDomainTasks(selectedDomain.id, [...tasks, createdTask]);
      upsertCategory(result.data.category);
      setNewTaskName("");
      setNewTaskDescription("");
      setNewTaskCategoryId("");
      setNewTaskCategoryName("");
      setCreateTaskColumn(null);
    });
  };

  const handleDeleteTask = () => {
    if (!selectedDomain || !deletingTaskId) {
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await deleteGanttTaskAction({
        projectId,
        domainId: selectedDomain.id,
        taskId: deletingTaskId,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }

      setDomainTasks(
        selectedDomain.id,
        selectedDomain.tasks.filter((task) => task.id !== deletingTaskId)
      );
      setDeletingTaskId(null);
    });
  };

  const handleCopyTaskToClipboard = async (task: Task) => {
    const content = `Title: ${task.name}\nDescription: ${task.description}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
        toast.success("Task details copied");
        return;
      }

      const textarea = document.createElement("textarea");
      textarea.value = content;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const isCopied = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (!isCopied) {
        throw new Error("Clipboard copy command failed");
      }
      toast.success("Task details copied");
    } catch {
      setError("Failed to copy task details");
      toast.error("Failed to copy task details");
    }
  };

  const handleEditTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDomain || !editingTask) {
      return;
    }

    const currentTask = selectedDomain.tasks.find((task) => task.id === editingTask.id);
    if (!currentTask) {
      setError("Task not found");
      return;
    }

    startTransition(async () => {
      const result = await updateGanttTaskAction({
        projectId,
        domainId: selectedDomain.id,
        taskId: editingTask.id,
        name: editingTask.name,
        description: editingTask.description,
        pageData: { ...((currentTask.pageData as object) ?? {}), column: currentTask.column },
        position: currentTask.position,
        ganttcolumnType: columnIdToGanttColumnType(currentTask.column),
        categoryId: editingTask.categoryId || undefined,
        newCategoryName: editingTask.newCategoryName,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }
      if (!result.data) {
        setError("Failed to update task");
        return;
      }

      const updatedTask = normalizeTask(result.data);
      setDomainTasks(
        selectedDomain.id,
        selectedDomain.tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
      );
      upsertCategory(result.data.category);
      setEditingTask(null);
    });
  };

  const handleColumnChange = (nextTasks: Task[]) => {
    if (!selectedDomain) {
      return;
    }

    const positionedNextTasks = nextTasks.map((task, index) => ({ ...task, position: index }));
    const nextTaskIds = new Set(positionedNextTasks.map((task) => task.id));
    const hiddenTasks = selectedDomain.tasks.filter((task) => !nextTaskIds.has(task.id));
    const nextAllTasks = [...positionedNextTasks, ...hiddenTasks];
    setDomainTasks(selectedDomain.id, nextAllTasks);
    setError("");
  };

  const handleColumnSave = async (nextTasks: Task[]) => {
    if (!selectedDomain) {
      return;
    }

    const previousById = new Map(selectedDomain.tasks.map((task) => [task.id, task]));
    const positionedNextTasks = nextTasks.map((task, index) => ({ ...task, position: index }));
    const nextTaskIds = new Set(positionedNextTasks.map((task) => task.id));
    const hiddenTasks = selectedDomain.tasks.filter((task) => !nextTaskIds.has(task.id));
    const nextAllTasks = [...positionedNextTasks, ...hiddenTasks];

    const changedTasks = positionedNextTasks.filter((task) => {
      const previous = previousById.get(task.id);
      if (!previous) {
        return false;
      }

      const persistedColumn = getColumnFromPageData(task.pageData);

      return (
        previous.column !== task.column ||
        previous.position !== task.position ||
        persistedColumn !== task.column
      );
    });

    if (changedTasks.length === 0) {
      return;
    }

    const results = await Promise.all(
      changedTasks.map(async (task) =>
        updateGanttTaskAction({
          projectId,
          domainId: selectedDomain.id,
          taskId: task.id,
          name: task.name,
          description: task.description,
          pageData: { ...((task.pageData as object) ?? {}), column: task.column },
          position: task.position,
          ganttcolumnType: columnIdToGanttColumnType(task.column),
          categoryId: task.categoryId,
        })
      )
    );

    const failedResult = results.find((result) => !result.success);
    if (failedResult && !failedResult.success) {
      setError(failedResult.error);
      setDomainTasks(selectedDomain.id, selectedDomain.tasks);
      throw new Error(failedResult.error);
    }

    const byId = new Map(
      results
        .filter((result): result is { success: true; data: GanttTaskItem } => Boolean(result.success && result.data))
        .map((result) => [result.data.id, normalizeTask(result.data)])
    );
    setDomainTasks(
      selectedDomain.id,
      nextAllTasks.map((task) => byId.get(task.id) ?? task)
    );
  };

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-md border p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Domains</h3>
          <Popover open={isCreateDomainOpen} onOpenChange={setIsCreateDomainOpen}>
            <PopoverTrigger asChild>
              <Button type="button" size="sm" variant="outline" disabled={isPending}>
                <Plus className="size-4" />
                New
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <PopoverHeader>
                <PopoverTitle>Create Domain</PopoverTitle>
                <PopoverDescription>
                  Each domain gets its own gantt board.
                </PopoverDescription>
              </PopoverHeader>
              <form onSubmit={handleCreateDomain} className="mt-3 space-y-2">
                <Input
                  placeholder="Domain name"
                  value={newDomainName}
                  onChange={(e) => setNewDomainName(e.target.value)}
                  disabled={isPending}
                />
                <Textarea
                  placeholder="Domain description"
                  value={newDomainDescription}
                  onChange={(e) => setNewDomainDescription(e.target.value)}
                  disabled={isPending}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateDomainOpen(false)}
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

        <HorizontalScrollControls
          leftAriaLabel="Scroll domains left"
          rightAriaLabel="Scroll domains right"
          disabled={isPending} 

        >
          {sortedDomains.length === 0 ? (
            <p className="text-sm text-muted-foreground">No domains yet. Create one to start planning.</p>
          ) : (
            <div className="flex min-w-max gap-2 pb-1">
              {sortedDomains.map((domain) => {
                const isSelected = selectedDomainId === domain.id;
                const isEditing = editingDomainId === domain.id;
                const completedTaskCount = domain.tasks.filter((task) => task.column === "done").length;
                const totalTaskCount = domain.tasks.length;
                return (
                  <div
                    key={domain.id}
                    className={`group min-w-56 rounded-md border p-2 transition-colors ${
                      isSelected ? "border-primary/50 bg-accent/30" : "hover:bg-accent/20"
                    }`}
                  >
                    <div
                      className="w-full text-left hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedDomainId(domain.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{domain.name}</p>
                        <div className="flex shrink-0 items-center gap-1 text-xs">
                          <span className="rounded border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                            {completedTaskCount}
                          </span>
                          <span className="rounded border border-muted-foreground/30 bg-muted/40 px-1.5 py-0.5 text-muted-foreground">
                            {totalTaskCount}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ${
                        isEditing ? "grid-rows-[1fr]" : "grid-rows-[0fr] group-hover:grid-rows-[1fr]"
                      }`}
                    >
                      <div className="min-h-0">
                        <p className="line-clamp-2 mt-1 text-xs text-muted-foreground">
                          {domain.description}
                        </p>
                        <div className="mt-2 flex justify-end gap-1">
                          <Popover
                            open={isEditing}
                            onOpenChange={(open) => {
                              if (open) {
                                setEditingDomainId(domain.id);
                                setEditDomainName(domain.name);
                                setEditDomainDescription(domain.description);
                                return;
                              }
                              setEditingDomainId(null);
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                size="icon-xs"
                                variant="outline"
                                aria-label={`Edit ${domain.name}`}
                                disabled={isPending}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-80">
                              <PopoverHeader>
                                <PopoverTitle>Edit Domain</PopoverTitle>
                                <PopoverDescription>
                                  Update domain name and description.
                                </PopoverDescription>
                              </PopoverHeader>
                              <form
                                onSubmit={(event) => handleUpdateDomain(event, domain.id)}
                                className="mt-3 space-y-2"
                              >
                                <Input
                                  value={editDomainName}
                                  onChange={(e) => setEditDomainName(e.target.value)}
                                  placeholder="Domain name"
                                  disabled={isPending}
                                />
                                <Textarea
                                  value={editDomainDescription}
                                  onChange={(e) => setEditDomainDescription(e.target.value)}
                                  placeholder="Domain description"
                                  disabled={isPending}
                                  rows={3}
                                  className="resize-none"
                                />
                                <div className="flex justify-end gap-2 pt-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingDomainId(null)}
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
                            aria-label={`Delete ${domain.name}`}
                            onClick={() => setDeletingDomainId(domain.id)}
                            disabled={isPending}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </HorizontalScrollControls>
      </section>

      <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-medium">
                {selectedDomain ? `${selectedDomain.name} Board` : "Select a domain"}
              </h3>
            </div>

          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Filter by category</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={activeCategoryFilterId === "all" ? "default" : "outline"}
                onClick={() => setActiveCategoryFilterId("all")}
                disabled={isPending}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  type="button"
                  size="sm"
                  variant={activeCategoryFilterId === category.id ? "default" : "outline"}
                  onClick={() => setActiveCategoryFilterId(category.id)}
                  disabled={isPending}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
          {isMounted && selectedDomain ? (
            <KanbanProvider<Task, Column>
              columns={columns}
              data={filteredTasks}
              onDataChange={handleColumnChange}
              onDataSave={handleColumnSave}
            >
              {(column) => (
                <KanbanBoard id={column.id} key={column.id}>
                  <KanbanHeader>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: column.color }}
                        />
                        <span>{column.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          {taskCountByColumn[column.id]}
                        </span>
                        <Popover
                          open={createTaskColumn === column.id}
                          onOpenChange={(open) => {
                            if (open) {
                              setCreateTaskColumn(column.id);
                              return;
                            }
                            setCreateTaskColumn(null);
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              size="icon-xs"
                              variant="outline"
                              aria-label={`Create task in ${column.name}`}
                              disabled={isPending || !selectedDomain}
                            >
                              <Plus className="size-3.5" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-96">
                            <PopoverHeader>
                              <PopoverTitle>Create Task</PopoverTitle>
                              <PopoverDescription>
                                Add a task to the {column.name} column.
                              </PopoverDescription>
                            </PopoverHeader>
                            <form onSubmit={handleCreateTask} className="mt-3 space-y-2">
                              <Input
                                placeholder="Task name"
                                value={newTaskName}
                                onChange={(e) => setNewTaskName(e.target.value)}
                                disabled={isPending}
                              />
                              <Textarea
                                placeholder="Task description"
                                value={newTaskDescription}
                                onChange={(e) => setNewTaskDescription(e.target.value)}
                                disabled={isPending}
                                rows={3}
                                className="resize-none"
                              />
                              <CategoryPickerCreator
                                categories={categories}
                                selectedCategoryId={newTaskCategoryId}
                                onSelectedCategoryIdChange={setNewTaskCategoryId}
                                newCategoryName={newTaskCategoryName}
                                onNewCategoryNameChange={setNewTaskCategoryName}
                                disabled={isPending}
                              />
                              <div className="flex justify-end gap-2 pt-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCreateTaskColumn(null)}
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
                  </KanbanHeader>
                  <KanbanCards id={column.id}>
                    {(task: Task) => (
                      <KanbanCard column={column.id} id={task.id} key={task.id} name={task.name}>
                        <div className="group space-y-2">
                          <div className="min-w-0">
                            <p className="m-0 text-sm font-medium wrap-anywhere">{task.name}</p>
                            <p className="m-0 text-xs text-muted-foreground wrap-anywhere">
                              {task.description}
                            </p>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                              {task.categoryName}
                            </p>
                            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                              <Button
                                type="button"
                                size="icon-xs"
                                variant="outline"
                                aria-label={`Copy ${task.name}`}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() => void handleCopyTaskToClipboard(task)}
                                disabled={isPending}
                              >
                                <Clipboard className="size-3.5" />
                              </Button>
                              <Popover
                                open={editingTask?.id === task.id}
                                onOpenChange={(open) => {
                                  if (open) {
                                    setEditingTask({
                                      id: task.id,
                                      name: task.name,
                                      description: task.description,
                                      categoryId: task.categoryId,
                                      newCategoryName: "",
                                    });
                                    return;
                                  }
                                  if (editingTask?.id === task.id) {
                                    setEditingTask(null);
                                  }
                                }}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    size="icon-xs"
                                    variant="outline"
                                    aria-label={`Edit ${task.name}`}
                                    disabled={isPending}
                                    onPointerDown={(e) => e.stopPropagation()}
                                  >
                                    <Pencil className="size-3.5" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-96">
                                  <PopoverHeader>
                                    <PopoverTitle>Edit Task</PopoverTitle>
                                    <PopoverDescription>
                                      Update task details and category.
                                    </PopoverDescription>
                                  </PopoverHeader>
                                  {editingTask?.id === task.id ? (
                                    <form onSubmit={handleEditTask} className="mt-3 space-y-2">
                                      <Input
                                        value={editingTask.name}
                                        onChange={(e) =>
                                          setEditingTask((prev) =>
                                            prev ? { ...prev, name: e.target.value } : prev
                                          )
                                        }
                                        disabled={isPending}
                                        placeholder="Task name"
                                      />
                                      <Textarea
                                        value={editingTask.description}
                                        onChange={(e) =>
                                          setEditingTask((prev) =>
                                            prev ? { ...prev, description: e.target.value } : prev
                                          )
                                        }
                                        disabled={isPending}
                                        placeholder="Task description"
                                        rows={3}
                                        className="resize-none"
                                      />
                                      <CategoryPickerCreator
                                        categories={categories}
                                        selectedCategoryId={editingTask.categoryId}
                                        onSelectedCategoryIdChange={(value) =>
                                          setEditingTask((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  categoryId: value,
                                                  newCategoryName: "",
                                                }
                                              : prev
                                          )
                                        }
                                        newCategoryName={editingTask.newCategoryName}
                                        onNewCategoryNameChange={(value) =>
                                          setEditingTask((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  newCategoryName: value,
                                                  categoryId: value.trim() ? "" : prev.categoryId,
                                                }
                                              : prev
                                          )
                                        }
                                        disabled={isPending}
                                      />
                                      <div className="flex justify-end gap-2 pt-1">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setEditingTask(null)}
                                          disabled={isPending}
                                        >
                                          Cancel
                                        </Button>
                                        <Button type="submit" size="sm" disabled={isPending}>
                                          {isPending ? "Saving..." : "Save"}
                                        </Button>
                                      </div>
                                    </form>
                                  ) : null}
                                </PopoverContent>
                              </Popover>
                              <Button
                                type="button"
                                size="icon-xs"
                                variant="ghost"
                                aria-label={`Delete ${task.name}`}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() => setDeletingTaskId(task.id)}
                                disabled={isPending}
                              >
                                <Trash2 className="size-3.5 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </KanbanCard>
                    )}
                  </KanbanCards>
                </KanbanBoard>
              )}
            </KanbanProvider>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {columns.map((column) => (
                <div key={column.id} className="rounded-md border bg-secondary p-3 text-sm">
                  <p className="font-semibold">{column.name}</p>
                </div>
              ))}
            </div>
          )}
      </div>

      {error ? (
        <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>
      ) : null}

      <ConfirmModal
        open={Boolean(deletingTaskId)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingTaskId(null);
          }
        }}
        title="Delete task?"
        description="This task will be permanently removed from this domain board."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isPending={isPending}
        onConfirm={handleDeleteTask}
      />

      <ConfirmModal
        open={Boolean(deletingDomainId)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingDomainId(null);
          }
        }}
        title="Delete domain?"
        description="This permanently removes the domain and all its tasks."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isPending={isPending}
        onConfirm={handleDeleteDomain}
      />
    </div>
  );
}
