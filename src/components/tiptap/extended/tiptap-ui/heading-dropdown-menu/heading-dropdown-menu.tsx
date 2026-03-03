"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

// --- Hooks ---
import { useTiptapEditor } from "@/components/tiptap/hooks/use-tiptap-editor"
import type { UseHeadingDropdownMenuConfig } from "@/components/tiptap/extended/tiptap-ui/heading-dropdown-menu"
import { useHeadingDropdownMenu } from "@/components/tiptap/extended/tiptap-ui/heading-dropdown-menu"

// --- UI Primitives (ShadCN or custom wrappers) ---
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

export interface HeadingDropdownMenuProps
  extends UseHeadingDropdownMenuConfig {
  portal?: boolean
  onOpenChange?: (isOpen: boolean) => void
}

/**
 * Beautiful glassy dropdown for heading levels — integrated with TipTap
 */
export const HeadingDropdownMenu = React.forwardRef<
  HTMLButtonElement,
  HeadingDropdownMenuProps
>(
  (
    {
      editor: providedEditor,
      levels = [1, 2, 3, 4],
      hideWhenUnavailable = false,
      portal = false,
      onOpenChange,
    },
    ref
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const [isOpen, setIsOpen] = React.useState(false)
    const { isVisible, isActive, canToggle } = useHeadingDropdownMenu({
      editor,
      levels,
      hideWhenUnavailable,
    })

    if (!editor || !isVisible) return null

    const handleOpenChange = (open: boolean) => {
      if (!canToggle) return
      setIsOpen(open)
      onOpenChange?.(open)
    }

    // Helper: detect current heading
    const activeLevel =
      [1, 2, 3, 4].find((lvl) => editor.isActive("heading", { level: lvl })) ?? 0
    const label = activeLevel ? `H${activeLevel}` : "Text"

    return (
      <DropdownMenu modal open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            ref={ref}
            size="sm"
            variant="ghost"
            disabled={!canToggle}
            className={`
              flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-200
              hover:bg-blue-50 hover:text-blue-600
              transition-all rounded-md px-2 py-1
              ${isActive ? "bg-blue-100 text-blue-700 shadow-sm" : ""}
            `}
          >
            {label}
            <ChevronDown
              className={`h-4 w-4 ml-0.5 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="rounded-lg border border-border bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-lg p-2 min-w-[160px]"
        >
          
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`
              flex items-center justify-between gap-2 rounded-md px-2 py-1.5
              cursor-pointer select-none transition-all
              ${
                !activeLevel
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "hover:bg-blue-50 hover:text-blue-600"
              }
            `}
          >
            <span className="ml-1 text-sm font-medium">Paragraph</span>
            <span className="opacity-50 text-xs">Text</span>
          </DropdownMenuItem>
          
          {levels.map((level) => {
            const isActiveLevel = editor.isActive("heading", { level })
         

            return (
              <DropdownMenuItem
                key={level}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level }).run()
                }
                className={`
                  flex items-center justify-between gap-2 rounded-md px-2 py-1.5
                  cursor-pointer select-none transition-all
                  ${isActiveLevel ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-blue-50 hover:text-blue-600"}
                `}
              >
                <span className={`ml-1 `}>Heading {level}</span>
                <span className="opacity-50 text-xs">H{level}</span>
              </DropdownMenuItem>
            )
          })}

          <div className="h-[1px] bg-border my-2" />

          
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)

HeadingDropdownMenu.displayName = "HeadingDropdownMenu"
