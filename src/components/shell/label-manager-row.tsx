"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { labelColor, LABEL_COLOR_NAMES } from "@/lib/trello/label-colors";
import type { TrelloLabel } from "@/lib/trello/types";

interface LabelManagerRowProps {
  label: TrelloLabel;
  onChanged: (label: TrelloLabel) => void;
  onDeleted: (labelId: string) => void;
}

export function LabelManagerRow({ label, onChanged, onDeleted }: LabelManagerRowProps) {
  const [name, setName] = useState(label.name);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function saveName() {
    const trimmed = name.trim();
    if (trimmed === label.name) return;
    onChanged({ ...label, name: trimmed });
    fetch(`/api/labels/${label.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed, color: label.color }),
    });
  }

  function changeColor(color: string) {
    onChanged({ ...label, color });
    fetch(`/api/labels/${label.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: label.name, color }),
    });
  }

  async function confirmDelete() {
    setDeleting(true);
    onDeleted(label.id);
    await fetch(`/api/labels/${label.id}`, { method: "DELETE" });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1.5 text-sm">
        <span className="flex-1">Delete &quot;{label.name || "unnamed"}&quot;? Removes it from every card.</span>
        <Button size="xs" variant="destructive" onClick={confirmDelete} disabled={deleting}>
          Delete
        </Button>
        <Button size="xs" variant="ghost" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <Popover>
        <PopoverTrigger
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          className="block h-5 w-5 shrink-0 cursor-pointer rounded-sm"
          style={{ backgroundColor: labelColor(label.color) }}
        />
        <PopoverContent align="start" className="w-40 p-1">
          {LABEL_COLOR_NAMES.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => changeColor(color)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              <span className="h-3.5 w-3.5 rounded-sm" style={{ backgroundColor: labelColor(color) }} />
              {color}
              {label.color === color && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
            </button>
          ))}
        </PopoverContent>
      </Popover>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={saveName}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        placeholder="Unnamed"
        className="flex-1 border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="shrink-0 text-muted-foreground hover:text-destructive"
      >
        <HugeiconsIcon icon={Delete02Icon} size={14} />
      </button>
    </div>
  );
}
