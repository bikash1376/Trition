"use client";

import { useState, type MouseEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete02Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { labelColor, LABEL_COLOR_NAMES } from "@/lib/trello/label-colors";
import { newOptionId, type ColumnDef, type SelectOption } from "@/lib/trello/columns";

interface ColumnHeaderMenuProps {
  column: ColumnDef;
  onRenamed: (name: string) => void;
  onOptionsChanged: (options: SelectOption[]) => void;
  onDeleted: () => void;
}

export function ColumnHeaderMenu({ column, onRenamed, onOptionsChanged, onDeleted }: ColumnHeaderMenuProps) {
  const [name, setName] = useState(column.name);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [newOptionName, setNewOptionName] = useState("");

  function saveName() {
    const trimmed = name.trim();
    if (trimmed && trimmed !== column.name) onRenamed(trimmed);
    else setName(column.name);
  }

  function addOption() {
    const trimmed = newOptionName.trim();
    if (!trimmed) return;
    const usedColors = new Set((column.options ?? []).map((o) => o.color));
    const color = LABEL_COLOR_NAMES.find((c) => !usedColors.has(c)) ?? LABEL_COLOR_NAMES[0];
    onOptionsChanged([...(column.options ?? []), { id: newOptionId(), name: trimmed, color }]);
    setNewOptionName("");
  }

  function removeOption(id: string) {
    onOptionsChanged((column.options ?? []).filter((o) => o.id !== id));
  }

  return (
    <>
      <Popover>
        <PopoverTrigger
          onClick={(e: MouseEvent) => e.stopPropagation()}
          className="rounded p-0.5 text-muted-foreground opacity-100 hover:bg-accent hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
        >
          <HugeiconsIcon icon={PencilEdit02Icon} size={12} />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-2" onClick={(e) => e.stopPropagation()}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="h-7 text-sm"
          />
          {column.type === "select" && (
            <div className="mt-2 flex flex-col gap-1">
              <p className="text-xs font-medium text-muted-foreground">Options</p>
              {(column.options ?? []).map((opt) => (
                <div key={opt.id} className="flex items-center gap-1.5">
                  <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: labelColor(opt.color) }} />
                  <span className="flex-1 truncate text-sm">{opt.name}</span>
                  <button
                    type="button"
                    onClick={() => removeOption(opt.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={12} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-1">
                <Input
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addOption()}
                  placeholder="New option"
                  className="h-6 text-xs"
                />
                <Button size="icon-xs" variant="ghost" onClick={addOption}>
                  <HugeiconsIcon icon={Add01Icon} size={12} />
                </Button>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="mt-2 flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs text-destructive hover:bg-destructive/10"
          >
            <HugeiconsIcon icon={Delete02Icon} size={12} />
            Delete column
          </button>
        </PopoverContent>
      </Popover>
      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete column "${column.name}"?`}
        description="This removes the column and its values from every row."
        confirmLabel="Delete column"
        onConfirm={onDeleted}
      />
    </>
  );
}
