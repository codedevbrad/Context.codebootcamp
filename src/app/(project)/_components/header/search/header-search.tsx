"use client"

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react"
import { Input } from "@/components/ui/input"
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

type QuickLink = {
  label: string
  href: string
  keywords?: string[]
}

const quickLinks: QuickLink[] = [
  { label: "Home", href: "/", keywords: ["dashboard"] },
  { label: "About", href: "/my/about" },
  { label: "Inspiration", href: "/my/inspiration", keywords: ["ideas"] },
  { label: "My Projects", href: "/my", keywords: ["projects"] },
]

type HeaderSearchProps = {
  recentActivity: ActivityItem[]
}

export function HeaderSearch({ recentActivity }: HeaderSearchProps) {
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

  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const recentLinks = recentActivity.map((item) => ({
      label: item.title,
      href: item.path,
      type: "Recent" as const,
      searchable: `${item.title} ${item.path}`.toLowerCase(),
    }))

    const quickItems = quickLinks.map((item) => ({
      label: item.label,
      href: item.href,
      type: "Quick Link" as const,
      searchable: `${item.label} ${item.href} ${(item.keywords || []).join(" ")}`.toLowerCase(),
    }))

    return [...recentLinks, ...quickItems]
      .filter((item, index, arr) => arr.findIndex((candidate) => candidate.href === item.href) === index)
      .filter((item) => (normalizedQuery ? item.searchable.includes(normalizedQuery) : true))
      .slice(0, 8)
  }, [query, recentActivity])

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
        <PopoverHeader className="px-1 py-1">
          <PopoverTitle>Quick Jump</PopoverTitle>
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
                <span className="text-muted-foreground shrink-0 text-xs">{result.type}</span>
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
