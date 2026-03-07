"use client";

import type { ReactNode } from "react";
import { VerticalScrollControls } from "@/components/custom/vertical-scroll-controls";

type MyLayoutScrollShellProps = {
  children: ReactNode;
};

export function MyLayoutScrollShell({ children }: MyLayoutScrollShellProps) {
  return (
    <VerticalScrollControls
      className="min-w-0 min-h-0 flex-1"
      viewportClassName="pr-1"
      controlsSide="right"
      upAriaLabel="Scroll page up"
      downAriaLabel="Scroll page down"
    >
      <div className="space-y-4">{children}</div>
    </VerticalScrollControls>
  );
}
