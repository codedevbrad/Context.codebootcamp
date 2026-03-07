"use client";

import type {
  Announcements,
  DndContextProps,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import tunnel from "tunnel-rat";
import { VerticalScrollControls } from "@/components/custom/vertical-scroll-controls";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const t = tunnel();

export type { DragEndEvent } from "@dnd-kit/core";

type KanbanItemProps = {
  id: string;
  name: string;
  column: string;
  position?: number;
} & Record<string, unknown>;

type KanbanColumnProps = {
  id: string;
  name: string;
} & Record<string, unknown>;

type KanbanContextProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = {
  columns: C[];
  data: T[];
  activeCardId: string | null;
};

const KanbanContext = createContext<KanbanContextProps>({
  columns: [],
  data: [],
  activeCardId: null,
});

export type KanbanBoardProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export const KanbanBoard = ({ id, children, className }: KanbanBoardProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      className={cn(
        "flex h-144 min-h-40 flex-col divide-y overflow-hidden rounded-md border bg-secondary text-xs shadow-sm ring-2 transition-all",
        isOver ? "ring-primary" : "ring-transparent",
        className
      )}
      ref={setNodeRef}
    >
      {children}
    </div>
  );
};

export type KanbanCardProps<T extends KanbanItemProps = KanbanItemProps> = T & {
  children?: ReactNode;
  className?: string;
};

export const KanbanCard = <T extends KanbanItemProps = KanbanItemProps>({
  id,
  name,
  children,
  className,
}: KanbanCardProps<T>) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transition,
    transform,
    isDragging,
  } = useSortable({
    id,
  });
  const { activeCardId } = useContext(KanbanContext) as KanbanContextProps;

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  return (
    <>
      <div style={style} {...listeners} {...attributes} ref={setNodeRef}>
        <Card
          className={cn(
            "cursor-grab gap-4 rounded-md p-3 shadow-sm",
            isDragging && "pointer-events-none cursor-grabbing opacity-30",
            className
          )}
        >
          {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
        </Card>
      </div>
      {activeCardId === id && (
        <t.In>
          <Card
            className={cn(
              "cursor-grab gap-4 rounded-md p-3 shadow-sm ring-2 ring-primary",
              isDragging && "cursor-grabbing",
              className
            )}
          >
            {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
          </Card>
        </t.In>
      )}
    </>
  );
};

export type KanbanCardsProps<T extends KanbanItemProps = KanbanItemProps> =
  Omit<HTMLAttributes<HTMLDivElement>, "children" | "id"> & {
    children: (item: T) => ReactNode;
    id: string;
  };

export const KanbanCards = <T extends KanbanItemProps = KanbanItemProps>({
  children,
  className,
  ...props
}: KanbanCardsProps<T>) => {
  const { data } = useContext(KanbanContext) as KanbanContextProps<T>;
  const filteredData = data
    .filter((item) => item.column === props.id)
    .sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER));
  const items = filteredData.map((item) => item.id);

  return (
    <SortableContext items={items}>
      <VerticalScrollControls
        upAriaLabel={`Scroll ${props.id} up`}
        downAriaLabel={`Scroll ${props.id} down`}
        controlsVerticalPosition="together"
      >
        <div
          className={cn("flex flex-col gap-2 p-2", className)}
          {...props}
        >
          {filteredData.map(children)}
        </div>
      </VerticalScrollControls>
    </SortableContext>
  );
};

export type KanbanHeaderProps = HTMLAttributes<HTMLDivElement>;

export const KanbanHeader = ({ className, ...props }: KanbanHeaderProps) => (
  <div className={cn("m-0 p-2 font-semibold text-sm", className)} {...props} />
);

export type KanbanProviderProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = Omit<DndContextProps, "children"> & {
  children: (column: C) => ReactNode;
  className?: string;
  columns: C[];
  data: T[];
  onDataChange?: (data: T[]) => void;
  onDataSave?: (data: T[]) => Promise<void> | void;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
};

export const KanbanProvider = <
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
>({
  children,
  onDragStart,
  onDragEnd,
  onDragOver,
  className,
  columns,
  data,
  onDataChange,
  onDataSave,
  ...props
}: KanbanProviderProps<T, C>) => {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartStateRef = useRef<{ id: string; column: string; index: number } | null>(null);

  useEffect(
    () => () => {
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
    },
    []
  );

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string;
    const activeIndex = data.findIndex((item) => item.id === activeId);
    const card = activeIndex === -1 ? undefined : data[activeIndex];
    if (card) {
      setActiveCardId(activeId);
      dragStartStateRef.current = {
        id: activeId,
        column: card.column,
        index: activeIndex,
      };
    } else {
      dragStartStateRef.current = null;
    }
    onDragStart?.(event);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeItem = data.find((item) => item.id === active.id);
    const overItem = data.find((item) => item.id === over.id);

    if (!activeItem) {
      return;
    }

    const activeColumn = activeItem.column;
    const overColumn =
      overItem?.column ||
      columns.find((col) => col.id === over.id)?.id ||
      columns[0]?.id;

    if (activeColumn !== overColumn) {
      let newData = [...data];
      const activeIndex = newData.findIndex((item) => item.id === active.id);
      const overIndex = newData.findIndex((item) => item.id === over.id);

      newData[activeIndex].column = overColumn;
      newData = arrayMove(newData, activeIndex, overIndex);

      onDataChange?.(newData);
    }

    onDragOver?.(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCardId(null);

    onDragEnd?.(event);

    const { active, over } = event;

    if (!over) {
      return;
    }

    let newData = [...data];
    let hasChanges = false;

    const oldIndex = newData.findIndex((item) => item.id === active.id);
    if (oldIndex === -1) {
      return;
    }

    const newIndex = newData.findIndex((item) => item.id === over.id);
    const overItem = newData[newIndex];
    const overColumn =
      overItem?.column ||
      columns.find((column) => column.id === over.id)?.id ||
      newData[oldIndex]?.column;

    if (overColumn && newData[oldIndex].column !== overColumn) {
      newData[oldIndex].column = overColumn as T["column"];
      hasChanges = true;
    }

    if (newIndex !== -1 && oldIndex !== newIndex) {
      newData = arrayMove(newData, oldIndex, newIndex);
      hasChanges = true;
    }

    if (!hasChanges) {
      const dragStartState = dragStartStateRef.current;
      const activeId = active.id as string;
      const currentIndex = newData.findIndex((item) => item.id === activeId);
      const currentItem = currentIndex === -1 ? undefined : newData[currentIndex];
      const changedSinceDragStart =
        dragStartState?.id === activeId &&
        currentItem &&
        (currentItem.column !== dragStartState.column || currentIndex !== dragStartState.index);

      if (changedSinceDragStart) {
        onDataChange?.(newData);

        if (!onDataSave) {
          dragStartStateRef.current = null;
          return;
        }

        setSaveStatus("saving");
        Promise.resolve(onDataSave(newData))
          .then(() => {
            setSaveStatus("saved");
            if (saveStatusTimeoutRef.current) {
              clearTimeout(saveStatusTimeoutRef.current);
            }
            saveStatusTimeoutRef.current = setTimeout(() => {
              setSaveStatus("idle");
            }, 1500);
          })
          .catch(() => {
            setSaveStatus("error");
          })
          .finally(() => {
            dragStartStateRef.current = null;
          });
      } else {
        dragStartStateRef.current = null;
      }
      return;
    }

    onDataChange?.(newData);

    if (!onDataSave) {
      return;
    }

    setSaveStatus("saving");
    Promise.resolve(onDataSave(newData))
      .then(() => {
        setSaveStatus("saved");
        if (saveStatusTimeoutRef.current) {
          clearTimeout(saveStatusTimeoutRef.current);
        }
        saveStatusTimeoutRef.current = setTimeout(() => {
          setSaveStatus("idle");
        }, 1500);
      })
      .catch(() => {
        setSaveStatus("error");
      })
      .finally(() => {
        dragStartStateRef.current = null;
      });
  };

  const announcements: Announcements = {
    onDragStart({ active }) {
      const { name, column } = data.find((item) => item.id === active.id) ?? {};

      return `Picked up the card "${name}" from the "${column}" column`;
    },
    onDragOver({ active, over }) {
      const { name } = data.find((item) => item.id === active.id) ?? {};
      const newColumn = columns.find((column) => column.id === over?.id)?.name;

      return `Dragged the card "${name}" over the "${newColumn}" column`;
    },
    onDragEnd({ active, over }) {
      const { name } = data.find((item) => item.id === active.id) ?? {};
      const newColumn = columns.find((column) => column.id === over?.id)?.name;

      return `Dropped the card "${name}" into the "${newColumn}" column`;
    },
    onDragCancel({ active }) {
      const { name } = data.find((item) => item.id === active.id) ?? {};

      return `Cancelled dragging the card "${name}"`;
    },
  };

  return (
    <KanbanContext.Provider value={{ columns, data, activeCardId }}>
      <DndContext
        accessibility={{ announcements }}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
        sensors={sensors}
        {...props}
      >
        <div
          className={cn(
            "relative size-full",
            className
          )}
        >
          <div className="grid size-full auto-cols-fr grid-flow-col gap-4">
            {columns.map((column) => children(column))}
          </div>
          { saveStatus !== "idle" && (
            <div className="pointer-events-none absolute right-2 top-[-20px] rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
              {saveStatus === "saving" && "Saving..."}
              {saveStatus === "saved" && "Saved"}
              {saveStatus === "error" && "Save failed"}
            </div>
          )}
        </div>
        {typeof window !== "undefined" &&
          createPortal(
            <DragOverlay>
              <t.Out />
            </DragOverlay>,
            document.body
          )}
      </DndContext>
    </KanbanContext.Provider>
  );
};
