"use client"

import { Button } from "@/components/ui/button"
import { Maximize, Minimize } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

export function ZenSpaceButton() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    onFullscreenChange()
    document.addEventListener("fullscreenchange", onFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange)
    }
  }, [])

  const toggleZenSpace = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        return
      }

      await document.documentElement.requestFullscreen()
    } catch {
      // Fullscreen may be unavailable or blocked by the browser.
    }
  }, [])

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggleZenSpace}
      aria-label={isFullscreen ? "Exit zen space" : "Enter zen space"}
    >
      {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
      <span className="hidden md:inline">{isFullscreen ? "Exit Zen" : "Zen Space"}</span>
    </Button>
  )
}
