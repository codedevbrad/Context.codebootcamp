"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToolbarButtonProps = {
  cmd: () => void;
  icon: ReactNode;
  active?: boolean;
};

export function ToolbarButton({ cmd, icon, active }: ToolbarButtonProps) {
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={cmd}
      className={cn(
        "h-8 w-8 transition-all hover:bg-blue-50 hover:text-blue-600",
        active && "bg-blue-100 text-blue-700 shadow-sm"
      )}
      style={{
        borderRadius: "8px",
        padding: "4px",
      }}
    >
      {icon}
    </Button>
  );
}
