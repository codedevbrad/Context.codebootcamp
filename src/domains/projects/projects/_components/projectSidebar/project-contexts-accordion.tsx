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
import { useProjectContexts } from "@/domains/projects/project/_swr/useProjectContexts";

type ProjectContextsAccordionProps = {
  projectId: string;
  pathname: string;
};

type SidebarContextItem = {
  id: string;
  name: string;
  description: string;
  contextGroupId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

function toTimestamp(value: Date | string) {
  return new Date(value).getTime();
}

export function ProjectContextsAccordion({ projectId, pathname }: ProjectContextsAccordionProps) {
  const { contexts, isLoading, createContext } = useProjectContexts(projectId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const sortedContexts = useMemo(
    () =>
      [...(contexts as SidebarContextItem[])].sort(
        (a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt)
      ),
    [contexts]
  );

  const handleCreateContext = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createContext(newName, newDescription);

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (!result.data) {
        setError("Unable to create context");
        return;
      }

      const createdContext = result.data;
      setNewName("");
      setNewDescription("");
      setIsCreateOpen(false);
      router.push(`/my/project/${projectId}/contexts/context/${createdContext.id}`);
      router.refresh();
    });
  };

  return (
    <Accordion type="single" collapsible className="mt-2">
      <AccordionItem value={`contexts-${projectId}`} className="border-none">
        <AccordionTrigger className="rounded px-2 py-1 text-xs text-muted-foreground hover:no-underline cursor-pointer hover:bg-gray-200">
          <span>Contexts [{sortedContexts.length}]</span>
        </AccordionTrigger>
        <AccordionContent className="pb-0">
          {error ? (
            <p className="mx-2 mb-2 rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
              {error}
            </p>
          ) : null}
          {isLoading ? (
            <p className="px-2 pb-2 text-xs text-muted-foreground">Loading contexts...</p>
          ) : sortedContexts.length === 0 ? (
            <p className="px-2 pb-2 text-xs text-muted-foreground">No contexts yet.</p>
          ) : (
            <ul className="space-y-1 px-2 pb-2">
              {sortedContexts.map((context) => {
                const contextHref = `/my/project/${projectId}/contexts/context/${context.id}`;
                const isContextActive = pathname === contextHref;

                return (
                  <li key={context.id}>
                    <Link
                      href={contextHref}
                      className={`block truncate rounded px-2 py-1 text-xs transition-colors ${
                        isContextActive
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent/50"
                      }`}
                      title={context.name}
                    >
                      {context.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

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
                  New Context
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <PopoverHeader>
                  <PopoverTitle>Create Context</PopoverTitle>
                  <PopoverDescription>
                    Add a new context linked to this project.
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
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
