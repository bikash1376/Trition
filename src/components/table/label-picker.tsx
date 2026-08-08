"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { labelColor } from "@/lib/trello/label-colors";
import type { TrelloLabel } from "@/lib/trello/types";

interface LabelPickerProps {
  cardId: string;
  selected: TrelloLabel[];
  options: TrelloLabel[];
  onChange: (labels: TrelloLabel[]) => void;
  children: React.ReactNode;
}

export function LabelPicker({ cardId, selected, options, onChange, children }: LabelPickerProps) {
  const namedOptions = options.filter((label) => label.name.trim().length > 0);
  const selectedIds = new Set(selected.map((label) => label.id));

  async function toggle(label: TrelloLabel) {
    const isSelected = selectedIds.has(label.id);
    onChange(isSelected ? selected.filter((l) => l.id !== label.id) : [...selected, label]);
    await fetch(`/api/cards/${cardId}/labels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labelId: label.id, add: !isSelected }),
    });
  }

  return (
    <Popover>
      <PopoverTrigger
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="contents text-left"
      >
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" onClick={(e) => e.stopPropagation()}>
        {namedOptions.length === 0 && (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">No named labels on this board.</p>
        )}
        {namedOptions.map((label) => (
          <button
            key={label.id}
            type="button"
            onClick={() => toggle(label)}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
          >
            <span className="h-3.5 w-3.5 shrink-0 rounded-sm" style={{ backgroundColor: labelColor(label.color) }} />
            <span className="flex-1 truncate">{label.name}</span>
            {selectedIds.has(label.id) && <span className="text-xs text-muted-foreground">✓</span>}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
