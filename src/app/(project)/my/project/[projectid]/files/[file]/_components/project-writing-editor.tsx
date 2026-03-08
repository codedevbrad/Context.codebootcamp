"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/custom/confirm-modal";
import TipTapEditor from "@/components/tiptap";
import { type ProjectWritingDetails } from "@/domains/projects/writing/db";
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
  projectId: string;
  writingId: string;
  initialWriting: ProjectWritingDetails;
};

export function ProjectWritingEditor({
  projectId,
  writingId,
  initialWriting,
}: ProjectWritingEditorProps) {
  const router = useRouter();
  const { writing, isLoading, updateWritingContent, deleteWriting: removeWriting } =
    useProjectWriting(projectId, writingId, initialWriting);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();



  const handleDeleteWriting = () => {
    startTransition(async () => {
      const result = await removeWriting();
      if (!result.success) {
        setError(result.error);
        return;
      }

      setIsDeleting(false);
      router.push(`/my/project/${projectId}/files`);
      router.refresh();
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

      <div className="flex-1 min-h-0 overflow-hidden">
        <TipTapEditor
          initialContent={normalizeTiptapContent(writing.content)}
          onUpdate={() => {
            setError("");
          }}
          onDebouncedUpdate={async (json) => {
            const safeJson = normalizeTiptapContent(json);
            const result = await updateWritingContent(safeJson);
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
    </section>
  );
}
