"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { labelColor } from "@/lib/trello/label-colors";
import type { ColumnDef, PropsValue } from "@/lib/trello/columns";

interface CustomCellProps {
  column: ColumnDef;
  value: PropsValue;
  onChange: (value: PropsValue) => void;
}

export function CustomCell({ column, value, onChange }: CustomCellProps) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value == null ? "" : String(value));

  if (column.type === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
        onClick={(e: MouseEvent) => e.stopPropagation()}
        className="h-4 w-4 cursor-pointer accent-primary"
      />
    );
  }

  if (column.type === "select") {
    const selected = column.options?.find((o) => o.id === value) ?? null;
    return (
      <Popover>
        <PopoverTrigger
          onClick={(e: MouseEvent) => e.stopPropagation()}
          className="block w-full cursor-pointer text-left"
        >
          {selected ? (
            <span
              className="inline-block rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-white"
              style={{ backgroundColor: labelColor(selected.color) }}
            >
              {selected.name}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-48 p-1" onClick={(e) => e.stopPropagation()}>
          {(column.options ?? []).length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">No options yet — edit the column to add some.</p>
          )}
          {value != null && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent"
            >
              Clear
            </button>
          )}
          {(column.options ?? []).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              <span className="h-3.5 w-3.5 shrink-0 rounded-sm" style={{ backgroundColor: labelColor(opt.color) }} />
              <span className="flex-1 truncate">{opt.name}</span>
              {opt.id === value && <span className="text-xs text-muted-foreground">✓</span>}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={(e: MouseEvent) => {
          e.stopPropagation();
          setLocal(value == null ? "" : String(value));
          setEditing(true);
        }}
        className="block min-h-5 w-full text-left text-sm"
      >
        {value == null || value === "" ? <span className="text-muted-foreground">—</span> : String(value)}
      </button>
    );
  }

  function commit() {
    setEditing(false);
    const trimmed = local.trim();
    if (trimmed === "") {
      onChange(null);
      return;
    }
    onChange(column.type === "number" ? Number(trimmed) : trimmed);
  }

  return (
    <Input
      autoFocus
      type={column.type === "number" ? "number" : column.type === "date" ? "date" : "text"}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation();
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") setEditing(false);
      }}
      onClick={(e: MouseEvent) => e.stopPropagation()}
      className="h-7 px-1.5 text-sm"
    />
  );
}
