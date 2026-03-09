"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  askContextQuestionAction,
  type ContextChatMessage,
} from "@/domains/contexts/db";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

  const threads: Array<{
    question: ContextChatMessage;
    responses: ContextChatMessage[];
  }> = [];
  const unthreadedMessages: ContextChatMessage[] = [];

  conversation.forEach((message) => {
    if (message.role === "user") {
      threads.push({ question: message, responses: [] });
      return;
    }

    const latestThread = threads[threads.length - 1];
    if (!latestThread) {
      unthreadedMessages.push(message);
      return;
    }

    latestThread.responses.push(message);
  });

  const scrollToThread = (threadIndex: number) => {
    const threadEl = document.getElementById(`question-thread-${threadIndex}`);
    if (!threadEl) {
      return;
    }

    threadEl.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="rounded-md border p-4 space-y-3">
      <h2 className="text-lg font-medium">Context Chat</h2>

      {error ? (
        <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="h-128 rounded-md border p-3">
          <h3 className="mb-2 text-sm font-medium">Questions</h3>
          {threads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No questions yet.</p>
          ) : (
            <nav className="space-y-1 overflow-y-auto pr-1">
              {threads.map((thread, index) => (
                <Button
                  key={`${thread.question.createdAt}-toc-${index}`}
                  type="button"
                  variant="ghost"
                  className="bg-gray-50 h-auto w-full justify-start whitespace-normal px-2 py-1.5 text-left text-xs"
                  onClick={() => scrollToThread(index)}
                >
                  {thread.question.content}
                </Button>
              ))}
            </nav>
          )}
        </aside>

        <div className="h-128 space-y-2 overflow-y-auto rounded-md border p-3">
          {conversation.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Start the conversation by asking a question.
            </p>
          ) : (
            <>
              {unthreadedMessages.map((message, index) => (
                <div
                  key={`${message.createdAt}-unthreaded-${index}`}
                  className="rounded p-2 text-sm text-foreground"
                >
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {message.role}
                  </p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}

              <Accordion type="multiple" className="w-full">
                {threads.map((thread, index) => (
                  <AccordionItem
                    key={`${thread.question.createdAt}-${index}`}
                    value={`question-${index}`}
                    id={`question-thread-${index}`}
                    className=""
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <span className="whitespace-pre-wrap text-left text-sm font-medium">
                        {thread.question.content}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pb-3">
                      {thread.responses.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No response yet.
                        </p>
                      ) : (
                        thread.responses.map((response, responseIndex) => (
                          <div
                            key={`${response.createdAt}-response-${responseIndex}`}
                            className="rounded-md bg-muted/40 p-2 text-sm text-foreground"
                          >
                            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              {response.role}
                            </p>
                            <p className="whitespace-pre-wrap">{response.content}</p>
                          </div>
                        ))
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </>
          )}
        </div>
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
