"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CategoryOption } from "@/domains/projects/project/db";

type CategoryPickerCreatorProps = {
  categories: CategoryOption[];
  selectedCategoryId: string;
  onSelectedCategoryIdChange: (value: string) => void;
  newCategoryName: string;
  onNewCategoryNameChange: (value: string) => void;
  disabled?: boolean;
};

export function CategoryPickerCreator({
  categories,
  selectedCategoryId,
  onSelectedCategoryIdChange,
  newCategoryName,
  onNewCategoryNameChange,
  disabled = false,
}: CategoryPickerCreatorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Category</p>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          return (
            <Button
              key={category.id}
              type="button"
              size="sm"
              variant={isSelected ? "default" : "outline"}
              className={cn("h-7 px-2 text-xs", isSelected ? "" : "text-muted-foreground")}
              onClick={() => {
                onSelectedCategoryIdChange(category.id);
                onNewCategoryNameChange("");
              }}
              disabled={disabled}
            >
              {category.name}
            </Button>
          );
        })}
      </div>

      <Input
        placeholder="Or create a new category"
        value={newCategoryName}
        onChange={(event) => {
          const value = event.target.value;
          onNewCategoryNameChange(value);
          if (value.trim()) {
            onSelectedCategoryIdChange("");
          }
        }}
        disabled={disabled}
      />
    </div>
  );
}
