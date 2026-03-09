"use client"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { History } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatVisitedAt, type ActivityItem } from "./recent-activity.utils"

type RecentActivityPopoverProps = {
  items: ActivityItem[]
}

export function RecentActivityPopover({ items }: RecentActivityPopoverProps) {
  const router = useRouter()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Recent activity">
          <History />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        <PopoverHeader className="px-1 py-1">
          <PopoverTitle>Recent Activity</PopoverTitle>
        </PopoverHeader>
        <div className="space-y-1">
          {items.length > 0 ? (
            items.map((item) => (
              <button
                type="button"
                key={item.path}
                onClick={() => router.push(item.path)}
                className="hover:bg-accent flex w-full items-center justify-between rounded px-2 py-1.5 text-left"
              >
                <span className="truncate pr-2 text-sm">{item.title}</span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {formatVisitedAt(item.visitedAt)}
                </span>
              </button>
            ))
          ) : (
            <p className="text-muted-foreground px-2 py-1 text-sm">No activity yet.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
