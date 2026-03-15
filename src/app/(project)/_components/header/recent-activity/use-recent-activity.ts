"use client"

import { useEffect, useRef, useState } from "react"
import {
  formatPathAsTitle,
  MAX_RECENT_ITEMS,
  type ActivityItem,
  readRecentActivityStorage,
  RECENT_ACTIVITY_STORAGE_KEY,
} from "./recent-activity.utils"

export function useRecentActivity(pathname: string | null) {
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>(() => readRecentActivityStorage())
  const skipTrackPathRef = useRef<string | null>(null)

  useEffect(() => {
    const currentPath = pathname || "/"
    if (skipTrackPathRef.current === currentPath) {
      skipTrackPathRef.current = null
      setRecentActivity(readRecentActivityStorage())
      return
    }

    const storedItems = readRecentActivityStorage()
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

    setRecentActivity(mergedItems)
  }, [pathname])

  const clearRecentActivity = () => {
    skipTrackPathRef.current = pathname || "/"
    localStorage.setItem(RECENT_ACTIVITY_STORAGE_KEY, JSON.stringify([]))
    setRecentActivity([])
  }

  return {
    recentActivity,
    clearRecentActivity,
  }
}
