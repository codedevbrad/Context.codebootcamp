"use client"

import { useMemo } from "react"
import type { ActivityItem } from "../recent-activity/recent-activity.utils"

type SearchResultItem = {
  label: string
  href: string
  type: "Recent"
  pills: string[]
  searchable: string
}

function getPathTypePill(path: string) {
  const segments = path.split("/").filter(Boolean)
  const typeCandidates = [
    { segment: "files", label: "File" },
    { segment: "tasks", label: "Tasks" },
    { segment: "contexts", label: "Context" },
    { segment: "context", label: "Context" },
  ] as const

  let bestMatch: { label: string; index: number } | null = null
  for (const candidate of typeCandidates) {
    const index = segments.indexOf(candidate.segment)
    if (index === -1) {
      continue
    }

    if (!bestMatch || index < bestMatch.index) {
      bestMatch = { label: candidate.label, index }
    }
  }

  return bestMatch?.label ?? "Recent"
}

export function useHistoryRefresh(query: string, recentActivity: ActivityItem[]) {
  return useMemo<SearchResultItem[]>(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const recentLinks = recentActivity.map((item) => {
      return {
        label: item.title,
        href: item.path,
        type: "Recent" as const,
        pills: [getPathTypePill(item.path)],
        searchable: `${item.title} ${item.path}`.toLowerCase(),
      }
    })

    return recentLinks
      .filter((item, index, arr) => arr.findIndex((candidate) => candidate.href === item.href) === index)
      .filter((item) => (normalizedQuery ? item.searchable.includes(normalizedQuery) : true))
      .slice(0, 8)
  }, [query, recentActivity])
}
