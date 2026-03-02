"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
  createContextInGroupAction,
  type ContextListItem,
} from "@/domains/contexts/db";

type ContextGroupPageProps = {
  group: {
    id: string;
    name: string;
    description: string;
    contexts: ContextListItem[];
  };
};

type GroupContextItem = Omit<ContextListItem, "createdAt" | "updatedAt"> & {
  createdAt: Date | string;
  updatedAt: Date | string;
};

function toTimestamp(value: Date | string) {
  return new Date(value).getTime();
}

export function ContextGroupPage({ group }: ContextGroupPageProps) {
  const router = useRouter();
  const [contexts, setContexts] = useState<GroupContextItem[]>(group.contexts);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const sortedContexts = useMemo(
    () =>
      [...contexts].sort(
        (a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt)
      ),
    [contexts]
  );

  const handleCreateContext = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createContextInGroupAction(
        group.id,
        newName,
        newDescription
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (!result.data) {
        setError("Unable to create context");
        return;
      }

      const createdContext = result.data;
      setContexts((prev) => [createdContext, ...prev]);
      setNewName("");
      setNewDescription("");
      setIsCreateOpen(false);
      router.push(`/my/context/${createdContext.id}`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{group.name}</h1>
        <p className="text-muted-foreground">{group.description}</p>
      </div>

      <section className="rounded-md border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Contexts in this group</h2>
          <Popover open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="size-4" />
                New Context
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <PopoverHeader>
                <PopoverTitle>Create Context</PopoverTitle>
                <PopoverDescription>
                  Create a context linked to this group.
                </PopoverDescription>
              </PopoverHeader>
              <form onSubmit={handleCreateContext} className="mt-3 space-y-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Context name"
                  disabled={isPending}
                />
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Context description"
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

        {sortedContexts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No contexts in this group yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {sortedContexts.map((context) => (
              <li key={context.id} className="rounded border p-2">
                <Link href={`/my/context/${context.id}`} className="block">
                  <p className="font-medium">{context.name}</p>
                  <p className="text-sm text-muted-foreground">{context.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
