"use client"

import { useEffect, useState } from "react"
import {
  formatPathAsTitle,
  MAX_RECENT_ITEMS,
  type ActivityItem,
  readRecentActivityStorage,
  RECENT_ACTIVITY_STORAGE_KEY,
} from "./recent-activity.utils"

export function useRecentActivity(pathname: string | null) {
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>(() => readRecentActivityStorage())

  useEffect(() => {
    const storedItems = readRecentActivityStorage()
    const currentPath = pathname || "/"
    const currentItem: ActivityItem = {
      title: formatPathAsTitle(currentPath),
      path: currentPath,
      visitedAt: Date.now(),
    }

    const mergedItems = [currentItem, ...storedItems.filter((item) => item.path !== currentPath)].slice(
      0,
      MAX_RECENT_ITEMS
    )

    localStorage.setItem(RECENT_ACTIVITY_STORAGE_KEY, JSON.stringify(mergedItems))

    queueMicrotask(() => {
      setRecentActivity(mergedItems)
    })
  }, [pathname])

  return recentActivity
}
