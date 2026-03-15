"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useEditor, EditorContent, type Content } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Blockquote from "@tiptap/extension-blockquote";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { TextAlign } from "@tiptap/extension-text-align";
import { Dropcursor } from "@tiptap/extensions";

import { createLowlight } from "lowlight";
import js from "highlight.js/lib/languages/javascript";
import ts from "highlight.js/lib/languages/typescript";
import html from "highlight.js/lib/languages/xml";
import "highlight.js/styles/github-dark.css";
import { TipTapToolbar } from "./toolbar";


const lowlight = createLowlight({ javascript: js, typescript: ts, html });


export default function TipTapEditor({
  readOnly,
  initialContent,
  onUpdate,
  onDebouncedUpdate,
  updateDebounceMs = 700,
  showSaveStatus = false,
}: {
  initialContent?: Content;
  onUpdate?: (json: unknown) => void;
  onDebouncedUpdate?: (
    json: unknown
  ) => void | boolean | { success: boolean } | Promise<void | boolean | { success: boolean }>;
  updateDebounceMs?: number;
  showSaveStatus?: boolean;
  readOnly?: boolean
}) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onUpdateRef = useRef(onUpdate);
  const onDebouncedUpdateRef = useRef(onDebouncedUpdate);
  const updateDebounceMsRef = useRef(updateDebounceMs);
  const showSaveStatusRef = useRef(showSaveStatus);
  const [saveMessage, setSaveMessage] = useState("All changes saved");
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);
  useEffect(() => {
    onDebouncedUpdateRef.current = onDebouncedUpdate;
  }, [onDebouncedUpdate]);
  useEffect(() => {
    updateDebounceMsRef.current = updateDebounceMs;
  }, [updateDebounceMs]);
  useEffect(() => {
    showSaveStatusRef.current = showSaveStatus;
  }, [showSaveStatus]);
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const editor = useEditor({
    extensions: [
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Placeholder.configure({ placeholder: "Start writing your notes..." }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: "text-blue-600 underline" },
      }),
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
      Blockquote,
      HorizontalRule,
      CodeBlockLowlight.configure({ lowlight }),
      Image,
      Dropcursor,
    ],

    content: initialContent,

    // Emit immediate updates and optional debounced updates.
    onUpdate: ({ editor }) => {
      const json = JSON.parse(JSON.stringify(editor.getJSON()));
      onUpdateRef.current?.(json);

      if (!onDebouncedUpdateRef.current) {
        return;
      }

      if (showSaveStatusRef.current) {
        setSaveMessage("Unsaved changes");
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        void (async () => {
          if (showSaveStatusRef.current) {
            setSaveMessage("Saving...");
          }

          try {
            const result = await onDebouncedUpdateRef.current?.(json);
            const isFailure =
              result === false ||
              (result &&
                typeof result === "object" &&
                "success" in result &&
                (result as { success: boolean }).success === false);

            if (showSaveStatusRef.current) {
              setSaveMessage(isFailure ? "Save failed" : "All changes saved");
            }
          } catch {
            if (showSaveStatusRef.current) {
              setSaveMessage("Save failed");
            }
          }
        })();
      }, updateDebounceMsRef.current);
    },

    immediatelyRender: false,
  });

  if (!isMounted || !editor)
    return (
      <div className="text-sm text-muted-foreground text-center py-10">
        Loading editor...
      </div>
    );

  const setLink = () => {
    const url = window.prompt("Enter link URL");
    if (url)
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      {!readOnly && (
        <TipTapToolbar
          editor={editor}
          onSetLink={setLink}
          showSaveStatus={showSaveStatus}
          saveMessage={saveMessage}
        />
      )}

      {/* Editor */}
      <div className="w-full flex-1 min-h-0  py-3 overflow-hidden">
      
        <div className="w-full h-full min-h-0 overflow-y-auto px-5 pl-8">
          <EditorContent
            editor={editor}
            className="prose prose-lg dark:prose-invert max-w-none focus:outline-none"
          />
        </div>
      </div>

      {/* Global Styling */}
      <style jsx global>{`
        .ProseMirror {
          outline: none;
          min-height: 100%;
          line-height: 1.75;
          font-size: 1.05rem;
        }
        .ProseMirror p { margin: 0 0 1.25rem; }

        .ProseMirror h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
        }
        .ProseMirror h2 {
          font-size: 1.6rem;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .ProseMirror h3 {
          font-size: 1.3rem;
          font-weight: 600;
          margin-top: 1.75rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror h4 {
          font-size: 1.1rem;
          font-weight: 500;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .ProseMirror ul,
        .ProseMirror ol {
          margin: 1rem 0 1rem 2rem;
          padding-left: 1.25rem;
        }
        .ProseMirror ul { list-style-type: disc; }
        .ProseMirror ol { list-style-type: decimal; }
        .ProseMirror li { margin-bottom: 0.4rem; }

        .ProseMirror blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin: 1.5rem 0;
          background: rgba(59, 130, 246, 0.05);
          border-radius: 0.25rem;
          font-style: italic;
        }

        .ProseMirror pre {
          background: #1e1e1e;
          color: white;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          font-size: 0.9em;
        }
      `}</style>
    </div>
  );
}

