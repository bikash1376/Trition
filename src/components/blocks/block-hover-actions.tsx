"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface BlockHoverActionsProps {
  onEdit?: () => void;
  onDelete: () => void;
}

export function BlockHoverActions({ onEdit, onDelete }: BlockHoverActionsProps) {
  return (
    <div className="absolute top-1 right-1 flex items-center gap-0.5 rounded-md border border-border bg-popover opacity-100 shadow-sm transition-opacity md:opacity-0 md:group-hover:opacity-100">
      {onEdit && (
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={onEdit}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              />
            }
          >
            <HugeiconsIcon icon={PencilEdit02Icon} size={13} />
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={onDelete}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
            />
          }
        >
          <HugeiconsIcon icon={Delete02Icon} size={13} />
        </TooltipTrigger>
        <TooltipContent>Delete</TooltipContent>
      </Tooltip>
    </div>
  );
}
