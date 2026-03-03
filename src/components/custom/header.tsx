"use client"

import { Profile } from "@/domains/user/_components/profile"
import Link from "next/link"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blurs px-5 flex justify-center">
      <div className="container flex h-14 items-center">
        <div className=" flex">
          <Link href="/" className="flex">
            <h3 className="font-bold">
              ContextIO
            </h3>
          </Link>   
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Profile />
          </nav>
        </div>
      </div>
    </header>
  );
}
