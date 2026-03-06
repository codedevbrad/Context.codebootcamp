"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  askContextQuestionAction,
  type ContextChatMessage,
} from "@/domains/contexts/db";
import { Textarea } from "@/components/ui/textarea";

type ContextChatProps = {
  contextId: string;
  initialConversation: ContextChatMessage[];
};

export function ContextChat({ contextId, initialConversation }: ContextChatProps) {
  const [conversation, setConversation] = useState<ContextChatMessage[]>(
    initialConversation
  );
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const askQuestion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await askContextQuestionAction(contextId, question);

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (!result.data) {
        setError("No response from model");
        return;
      }

      setConversation(result.data.conversation);
      setQuestion("");
    });
  };

  return (
    <section className="rounded-md border p-4 space-y-3">
      <h2 className="text-lg font-medium">Context Chat</h2>

      {error ? (
        <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="h-[32rem] space-y-2 overflow-y-auto rounded-md border p-3">
        {conversation.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Start the conversation by asking a question.
          </p>
        ) : (
          conversation.map((message, index) => (
            <div
              key={`${message.createdAt}-${index}`}
              className={`rounded p-2 text-sm ${
                message.role === "user"
                  ? "bg-black text-white border-rounded-xl"
                  : "  text-foreground"
              }`}
            >
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {message.role}
              </p>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={askQuestion} className="flex gap-2">
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about this context..."
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Asking..." : "Ask"}
        </Button>
      </form>
    </section>
  );
}
