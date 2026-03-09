export type ActivityItem = {
  title: string
  path: string
  visitedAt: number
}

export const RECENT_ACTIVITY_STORAGE_KEY = "contextio:recent-activity"
export const MAX_RECENT_ITEMS = 8

export function readRecentActivityStorage() {
  if (typeof window === "undefined") {
    return [] as ActivityItem[]
  }

  try {
    const raw = localStorage.getItem(RECENT_ACTIVITY_STORAGE_KEY)
    if (!raw) {
      return [] as ActivityItem[]
    }

    const parsed = JSON.parse(raw) as ActivityItem[]
    if (!Array.isArray(parsed)) {
      return [] as ActivityItem[]
    }

    return parsed.filter((item) => item?.path && item?.title && item?.visitedAt)
  } catch {
    return [] as ActivityItem[]
  }
}

export function formatPathAsTitle(pathname: string) {
  if (pathname === "/") {
    return "Home"
  }

  return pathname
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      segment
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    )
    .join(" / ")
}

export function formatVisitedAt(visitedAt: number) {
  const date = new Date(visitedAt)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()

  if (sameDay) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  })
}
