"use client"

import { Profile } from "@/domains/user/_components/profile"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { RecentActivityPopover } from "./recent-activity/recent-activity-popover"
import { useRecentActivity } from "./recent-activity/use-recent-activity"
import { HeaderSearch } from "./search/header-search"
import { ZenSpaceButton } from "./zen-space-button"

export function Header() {
  const pathname = usePathname()
  const recentActivity = useRecentActivity(pathname)

  return (
    <header className="sticky top-0 z-50 flex w-full justify-center border-b bg-background/95 px-5 backdrop-blur">
      <div className="container flex h-14 items-center gap-3">
        <div className="flex shrink-0">
          <Link href="/" className="flex">
            <h3 className="font-bold">Design.Codebootcamp</h3>
          </Link>   
        </div>

        <div className="hidden flex-1 md:flex">
          <HeaderSearch recentActivity={recentActivity} />
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2 md:flex-none">
          <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
            <Link href="/my/about">About</Link>
            <Link href="/my/inspiration">Inspiration</Link>
          </nav>
          <ZenSpaceButton />
          <RecentActivityPopover items={recentActivity} />
          <nav className="flex items-center space-x-2 text-sm font-medium">
            <Profile />
          </nav>
        </div>
      </div>
    </header>
  )
}
