"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

interface GoBackButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  text?: string;
}

export function GoBackButton({
  variant = "ghost",
  className,
  text,
}: GoBackButtonProps) {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleGoBack}
      className={className}
    >
      <ChevronLeft className="size-3" />
      {text}
    </Button>
  );
}
