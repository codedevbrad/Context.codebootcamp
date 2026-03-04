"use client";

import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/domains/user/_contexts/useUser";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export function Profile() {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return <div className="h-8 w-24 animate-pulse rounded bg-muted" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-4 bg-gray-100">
          <Avatar size="sm">
            <AvatarFallback>
              {getInitials(user?.username ?? "U")}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{user?.username ?? "Account"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {user ? (
          <>
            <DropdownMenuLabel className="space-y-1">
              <p className="text-sm leading-none font-medium">{user.username}</p>
              <p className="text-muted-foreground text-xs">Signed in</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <button
                type="button"
                className="w-full"
                onClick={async () => {
                  await signOut();
                }}
              >
                <LogOut />
                Sign Out
              </button>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel>Not signed in</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/auth/signin">
                <LogIn />
                Sign In
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/auth/signup">Sign Up</Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
