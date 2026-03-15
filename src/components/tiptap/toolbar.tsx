"use client";

import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare,
  Code,
  Highlighter,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo,
  Undo,
} from "lucide-react";

import { HeadingDropdownMenu } from "./extended/tiptap-ui/heading-dropdown-menu";
import { ToolbarButton } from "./toolbar-button";

type ToolbarProps = {
  editor: Editor;
  onSetLink: () => void;
  showSaveStatus?: boolean;
  saveMessage?: string;
};

export function TipTapToolbar({
  editor,
  onSetLink,
  showSaveStatus = false,
  saveMessage = "All changes saved",
}: ToolbarProps) {
  return (
    <div className="w-full pt-4 pb-2">
      {showSaveStatus ? (
        <div className="mb-2 flex justify-end">
          <span className="text-xs text-muted-foreground">{saveMessage}</span>
        </div>
      ) : null}
      <div className="w-full overflow-x-auto">
        <div className="mx-auto w-max bg-white/80 backdrop-blur-md border border-border shadow-md rounded-full px-3 py-2 flex flex-nowrap items-center gap-1 transition-all hover:shadow-lg">
          <HeadingDropdownMenu
            editor={editor}
            levels={[1, 2, 3, 4]}
            hideWhenUnavailable={false}
            portal={false}
          />

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
          <ToolbarButton cmd={onSetLink} icon={<LinkIcon />} />
          <ToolbarButton
            cmd={() => editor.chain().focus().setHorizontalRule().run()}
            icon={<Minus />}
          />

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
  );
}
