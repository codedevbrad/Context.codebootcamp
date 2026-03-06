"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HorizontalScrollControlsProps = {
  children: ReactNode;
  className?: string;
  viewportClassName?: string;
  contentClassName?: string;
  leftAriaLabel?: string;
  rightAriaLabel?: string;
  disabled?: boolean;
  scrollByPx?: number;
  minScrollByPx?: number;
  scrollByViewportFraction?: number;
};

export function HorizontalScrollControls({
  children,
  className,
  viewportClassName,
  contentClassName,
  leftAriaLabel = "Scroll left",
  rightAriaLabel = "Scroll right",
  disabled = false,
  scrollByPx,
  minScrollByPx = 220,
  scrollByViewportFraction = 0.75,
}: HorizontalScrollControlsProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateButtonState = useCallback(() => {
    const container = viewportRef.current;
    if (!container) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const epsilon = 2;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    setCanScrollLeft(container.scrollLeft > epsilon);
    setCanScrollRight(maxScrollLeft - container.scrollLeft > epsilon);
  }, []);

  const handleScroll = useCallback(
    (direction: "left" | "right") => {
      const container = viewportRef.current;
      if (!container) {
        return;
      }

      const amount =
        scrollByPx ??
        Math.max(minScrollByPx, Math.floor(container.clientWidth * scrollByViewportFraction));

      container.scrollBy({
        left: direction === "left" ? -amount : amount,
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
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        size="icon-xs"
        variant="outline"
        aria-label={leftAriaLabel}
        onClick={() => handleScroll("left")}
        disabled={disabled || !canScrollLeft}
      >
        <ChevronLeft className="size-3.5" />
      </Button>

      <div
        ref={viewportRef}
        onScroll={updateButtonState}
        className={cn(
          "min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          viewportClassName
        )}
      >
        <div ref={contentRef} className={contentClassName}>
          {children}
        </div>
      </div>

      <Button
        type="button"
        size="icon-xs"
        variant="outline"
        aria-label={rightAriaLabel}
        onClick={() => handleScroll("right")}
        disabled={disabled || !canScrollRight}
      >
        <ChevronRight className="size-3.5" />
      </Button>
    </div>
  );
}
