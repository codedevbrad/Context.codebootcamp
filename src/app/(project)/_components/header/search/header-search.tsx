"use client"

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import type { ActivityItem } from "../recent-activity/recent-activity.utils"
import { useHistoryRefresh } from "./use-history-refresh"

type HeaderSearchProps = {
  recentActivity: ActivityItem[]
  clearRecentActivity: () => void
}

export function HeaderSearch({ recentActivity, clearRecentActivity }: HeaderSearchProps) {
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        searchInputRef.current?.focus()
        setSearchOpen(true)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  const searchResults = useHistoryRefresh(query, recentActivity)

  const goToSearchResult = (href: string) => {
    router.push(href)
    setSearchOpen(false)
    setQuery("")
  }

  const onSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && searchResults[0]) {
      event.preventDefault()
      goToSearchResult(searchResults[0].href)
      return
    }

    if (event.key === "Escape") {
      setSearchOpen(false)
    }
  }

  return (
    <Popover open={searchOpen} onOpenChange={setSearchOpen}>
      <PopoverAnchor asChild>
        <div className="relative w-full max-w-xl">
          <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
          <Input
            ref={searchInputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={onSearchKeyDown}
            placeholder="Search pages or jump quickly..."
            className="pl-8 pr-14"
          />
          <span className="text-muted-foreground pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs">
            Ctrl+K
          </span>
        </div>
      </PopoverAnchor>
      <PopoverContent align="start" className="w-120 p-2">
        <PopoverHeader className="flex flex-row items-center justify-between px-1 py-1">
          <PopoverTitle>Quick Jump</PopoverTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearRecentActivity}
            disabled={recentActivity.length === 0}
            className="h-7 px-2 text-xs"
          >
            Clear history
          </Button>
        </PopoverHeader>
        <div className="space-y-1">
          {searchResults.length > 0 ? (
            searchResults.map((result) => (
              <button
                type="button"
                key={`${result.href}-${result.type}`}
                onClick={() => goToSearchResult(result.href)}
                className="hover:bg-accent flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm"
              >
                <span className="truncate pr-2">{result.label}</span>
                <span className="ml-2 flex shrink-0 items-center gap-1">
                  {result.pills.map((pill) => (
                    <span
                      key={`${result.href}-${pill}`}
                      className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                    >
                      {pill}
                    </span>
                  ))}
                </span>
              </button>
            ))
          ) : (
            <p className="text-muted-foreground px-2 py-1 text-sm">No matching pages found.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
