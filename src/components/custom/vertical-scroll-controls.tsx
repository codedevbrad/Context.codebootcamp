"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VerticalScrollControlsProps = {
  children: ReactNode;
  className?: string;
  viewportClassName?: string;
  contentClassName?: string;
  controlsSide?: "left" | "right";
  controlsVerticalPosition?: "together" | "ends";
  upAriaLabel?: string;
  downAriaLabel?: string;
  disabled?: boolean;
  scrollByPx?: number;
  minScrollByPx?: number;
  scrollByViewportFraction?: number;
};

export function VerticalScrollControls({
  children,
  className,
  viewportClassName,
  contentClassName,
  controlsSide = "right",
  controlsVerticalPosition = "ends",
  upAriaLabel = "Scroll up",
  downAriaLabel = "Scroll down",
  disabled = false,
  scrollByPx,
  minScrollByPx = 180,
  scrollByViewportFraction = 0.75,
}: VerticalScrollControlsProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateButtonState = useCallback(() => {
    const container = viewportRef.current;
    if (!container) {
      setCanScrollUp(false);
      setCanScrollDown(false);
      return;
    }

    const epsilon = 2;
    const maxScrollTop = container.scrollHeight - container.clientHeight;
    setCanScrollUp(container.scrollTop > epsilon);
    setCanScrollDown(maxScrollTop - container.scrollTop > epsilon);
  }, []);

  const handleScroll = useCallback(
    (direction: "up" | "down") => {
      const container = viewportRef.current;
      if (!container) {
        return;
      }

      const amount =
        scrollByPx ??
        Math.max(minScrollByPx, Math.floor(container.clientHeight * scrollByViewportFraction));

      container.scrollBy({
        top: direction === "up" ? -amount : amount,
        behavior: "smooth",
      });
    },
    [minScrollByPx, scrollByPx, scrollByViewportFraction]
  );

  useEffect(() => {
    const frameId = window.requestAnimationFrame(updateButtonState);
    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(updateButtonState);
    });

    if (viewportRef.current) {
      observer.observe(viewportRef.current);
    }
    if (contentRef.current) {
      observer.observe(contentRef.current);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [children, updateButtonState]);

  return (
    <div className={cn("flex min-h-0 flex-1 gap-2 my-2 mx-2", className)}>
      <div
        ref={viewportRef}
        onScroll={updateButtonState}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          viewportClassName
        )}
      >
        <div ref={contentRef} className={contentClassName}>
          {children}
        </div>
      </div>
      <div
        className={cn(
          "flex shrink-0 flex-col",
          controlsVerticalPosition === "ends"
            ? "self-stretch justify-between"
            : "justify-start gap-2",
          controlsSide === "left" ? "order-first" : "order-last"
        )}
      >
        <Button
          type="button"
          size="icon-xs"
          variant="outline"
          aria-label={upAriaLabel}
          onClick={() => handleScroll("up")}
          disabled={disabled || !canScrollUp}
        >
          <ChevronUp className="size-3.5" />
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant="outline"
          aria-label={downAriaLabel}
          onClick={() => handleScroll("down")}
          disabled={disabled || !canScrollDown}
        >
          <ChevronDown className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
