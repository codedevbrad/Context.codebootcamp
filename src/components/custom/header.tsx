"use client"
import { useUser } from "@/domains/user/_contexts/useUser"
import { SignOutButton } from "@/domains/user/_components/sign-out-button"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Header() {
  const { data: user, isLoading } = useUser();

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
            {isLoading ? (
              <div className="text-sm text-muted-foreground">
                {/* skeeton placeholder */}
                <div className="w-10 h-4 bg-muted rounded animate-pulse"></div>
                <div className="w-10 h-4 bg-muted rounded animate-pulse"></div>
                <div className="w-10 h-4 bg-muted rounded animate-pulse"></div>
              </div>
            ) : user ? (
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Signed in as </span>
                  <span className="font-medium">{user.username}</span>
                </div>
                <SignOutButton />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
