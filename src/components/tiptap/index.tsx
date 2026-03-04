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

import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Undo,
  Redo,
  Quote,
  Minus,
  Highlighter,
  CheckSquare,
  LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { HeadingDropdownMenu } from "./extended/tiptap-ui/heading-dropdown-menu";
import { cn } from "@/lib/utils";


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
    <div className="flex flex-col w-full h-screen">
      {!readOnly && (
        <div className="w-full px-6 sm:px-10 pt-4 pb-2">
          <div className="mx-auto max-w-4xl overflow-x-auto">
            <div className="w-max min-w-full bg-white/80 backdrop-blur-md border border-border shadow-md rounded-full px-3 py-2 flex flex-nowrap items-center gap-1 transition-all hover:shadow-lg">

        {/* Headings */}
        <HeadingDropdownMenu
          editor={editor}
          levels={[1, 2, 3, 4]}
          hideWhenUnavailable={false}
          portal={false}
        />

        {/* Formatting */}
        <ToolbarButton
          cmd={() => editor.chain().focus().toggleBold().run()}
          icon={<Bold />}
          active={editor.isActive("bold")}
        />
        <ToolbarButton
          cmd={() => editor.chain().focus().toggleItalic().run()}
          icon={<Italic />}
          active={editor.isActive("italic")}
        />
        <ToolbarButton
          cmd={() => editor.chain().focus().toggleHighlight().run()}
          icon={<Highlighter />}
          active={editor.isActive("highlight")}
        />

        {/* Lists */}
        <ToolbarButton
          cmd={() => editor.chain().focus().toggleBulletList().run()}
          icon={<List />}
          active={editor.isActive("bulletList")}
        />
        <ToolbarButton
          cmd={() => editor.chain().focus().toggleOrderedList().run()}
          icon={<ListOrdered />}
          active={editor.isActive("orderedList")}
        />
        <ToolbarButton
          cmd={() => editor.chain().focus().toggleTaskList().run()}
          icon={<CheckSquare />}
          active={editor.isActive("taskList")}
        />

        {/* Blocks */}
        <ToolbarButton
          cmd={() => editor.chain().focus().toggleBlockquote().run()}
          icon={<Quote />}
          active={editor.isActive("blockquote")}
        />
        <ToolbarButton
          cmd={() => editor.chain().focus().toggleCodeBlock().run()}
          icon={<Code />}
          active={editor.isActive("codeBlock")}
        />
        <ToolbarButton cmd={setLink} icon={<LinkIcon />} />
        <ToolbarButton
          cmd={() => editor.chain().focus().setHorizontalRule().run()}
          icon={<Minus />}
        />

        {/* Alignment */}
        <ToolbarButton
          cmd={() => editor.chain().focus().setTextAlign("left").run()}
          icon={<AlignLeft />}
          active={editor.isActive({ textAlign: "left" })}
        />
        <ToolbarButton
          cmd={() => editor.chain().focus().setTextAlign("center").run()}
          icon={<AlignCenter />}
          active={editor.isActive({ textAlign: "center" })}
        />
        <ToolbarButton
          cmd={() => editor.chain().focus().setTextAlign("right").run()}
          icon={<AlignRight />}
          active={editor.isActive({ textAlign: "right" })}
        />
        <ToolbarButton
          cmd={() => editor.chain().focus().setTextAlign("justify").run()}
          icon={<AlignJustify />}
          active={editor.isActive({ textAlign: "justify" })}
        />

        {/* Undo / Redo */}
        <div className="ml-2 flex gap-1 border-l pl-2 border-border">
          <ToolbarButton
            cmd={() => editor.chain().focus().undo().run()}
            icon={<Undo />}
          />
          <ToolbarButton
            cmd={() => editor.chain().focus().redo().run()}
            icon={<Redo />}
          />
        </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="w-full flex-1 px-6 sm:px-10 py-3">
        {showSaveStatus ? (
          <div className="mb-2 flex justify-end">
            <span className="text-xs text-muted-foreground">{saveMessage}</span>
          </div>
        ) : null}
        <EditorContent
          editor={editor}
          className="prose prose-lg dark:prose-invert max-w-4xl mx-auto focus:outline-none"
        />
      </div>

      {/* Global Styling */}
      <style jsx global>{`
        .ProseMirror {
          outline: none;
          min-height: calc(100vh - 120px);
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

/* --- ToolbarButton --- */
function ToolbarButton({
  cmd,
  icon,
  active,
}: {
  cmd: () => void;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={cmd}
      className={cn(
        "h-8 w-8 transition-all hover:bg-blue-50 hover:text-blue-600",
        active && "bg-blue-100 text-blue-700 shadow-sm"
      )}
      style={{
        borderRadius: "8px",
        padding: "4px",
      }}
    >
      {icon}
    </Button>
  );
}
