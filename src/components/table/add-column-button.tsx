"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ColumnType } from "@/lib/trello/columns";

const TYPE_OPTIONS: { value: ColumnType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "checkbox", label: "Checkbox" },
  { value: "select", label: "Select" },
];

export function AddColumnButton({ onAdd }: { onAdd: (name: string, type: ColumnType) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<ColumnType>("text");

  function submit() {
    if (!name.trim()) return;
    onAdd(name.trim(), type);
    setName("");
    setType("text");
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground">
        <HugeiconsIcon icon={Add01Icon} size={14} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Column name"
          className="h-7 text-sm"
        />
        <div className="mt-2 flex flex-wrap gap-1">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={`rounded px-2 py-1 text-xs ${
                type === opt.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={submit} disabled={!name.trim()}>
          Add column
        </Button>
      </PopoverContent>
    </Popover>
  );
}
