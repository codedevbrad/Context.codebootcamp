"use client";

import { useSession } from "next-auth/react";
import { SignOutButton } from "./sign-out-button";
import { Loader2 } from "lucide-react";

export function UserSession() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm">
        <span className="text-muted-foreground">Signed in as </span>
        <span className="font-medium">{session.user?.name}</span>
      </div>
      <SignOutButton />
    </div>
  );
}
