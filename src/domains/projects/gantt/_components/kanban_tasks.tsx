"use client";

import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/kibo-ui/kanban";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition, type FormEvent } from "react";
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
  updateProjectGanttTasksAction,
  type GanttTaskItem,
} from "@/domains/projects/project/db";

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
  initialTasks: unknown;
};

type Task = Omit<GanttTaskItem, "column"> & { column: ColumnId };

function normalizeTasks(value: unknown): Task[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const validColumnIds = new Set<ColumnId>(columns.map((col) => col.id));

  return value
    .map((item): Task | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const maybeItem = item as Partial<Task>;
      const id = typeof maybeItem.id === "string" ? maybeItem.id : null;
      const name = typeof maybeItem.name === "string" ? maybeItem.name : null;
      const description =
        typeof maybeItem.description === "string" ? maybeItem.description : "";
      const column =
        typeof maybeItem.column === "string" &&
        validColumnIds.has(maybeItem.column as ColumnId)
          ? (maybeItem.column as ColumnId)
          : null;
      const createdAt =
        typeof maybeItem.createdAt === "string"
          ? maybeItem.createdAt
          : new Date().toISOString();

      if (!id || !name || !column) {
        return null;
      }

      return {
        id,
        name,
        description,
        column,
        createdAt,
      };
    })
    .filter((item): item is Task => item !== null);
}

function createTaskId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function KanbanTasks({ projectId, initialTasks }: KanbanTasksProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(() => normalizeTasks(initialTasks));
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const persistTasks = (nextTasks: Task[]) => {
    setTasks(nextTasks);
    setError("");

    startTransition(async () => {
      const result = await updateProjectGanttTasksAction(projectId, nextTasks);
      if (!result.success) {
        setError(result.error);
        return;
      }

      if (result.data) {
        setTasks(normalizeTasks(result.data.gantttasks));
      }
    });
  };

  const handleCreateTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

    const task: Task = {
      id: createTaskId(),
      name: trimmedName,
      description: trimmedDescription,
      column: "planned",
      createdAt: new Date().toISOString(),
    };

    persistTasks([task, ...tasks]);
    setNewTaskName("");
    setNewTaskDescription("");
    setIsCreateOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    persistTasks(tasks.filter((task) => task.id !== taskId));
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Popover open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <PopoverTrigger asChild>
            <Button type="button" size="sm" variant="outline" disabled={isPending}>
              <Plus className="size-4" />
              New Task
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96">
            <PopoverHeader>
              <PopoverTitle>Create Task</PopoverTitle>
              <PopoverDescription>Add a task to the Planned column.</PopoverDescription>
            </PopoverHeader>
            <form onSubmit={handleCreateTask} className="mt-3 space-y-2">
              <Input
                placeholder="Task name"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                disabled={isPending}
              />
              <Input
                placeholder="Task description"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
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
        <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>
      ) : null}

      {isMounted ? (
        <KanbanProvider<Task, Column>
          columns={columns}
          data={tasks}
          onDataChange={persistTasks}
        >
          {(column) => (
            <KanbanBoard id={column.id} key={column.id}>
              <KanbanHeader>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <span>{column.name}</span>
                </div>
              </KanbanHeader>
              <KanbanCards id={column.id}>
                {(task: Task) => (
                  <KanbanCard column={column.id} id={task.id} key={task.id} name={task.name}>
                    <div className="group flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate font-medium text-sm">{task.name}</p>
                        <p className="m-0 truncate text-xs text-muted-foreground">
                          {task.description}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        aria-label={`Delete ${task.name}`}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
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
  );
}
