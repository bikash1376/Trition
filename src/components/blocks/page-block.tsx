"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { File01Icon } from "@hugeicons/core-free-icons";
import { BlockHoverActions } from "@/components/blocks/block-hover-actions";

interface PageBlockProps {
  cardId: string;
  listId: string;
  href: string;
  name: string;
  onRenamed: (listId: string, name: string) => void;
  onDeleted: (cardId: string) => void;
}

export function PageBlock({ cardId, listId, href, name, onRenamed, onDeleted }: PageBlockProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  function save() {
    setEditing(false);
    const trimmed = value.trim();
    if (!trimmed || trimmed === name) {
      setValue(name);
      return;
    }
    onRenamed(listId, trimmed);
    fetch(`/api/lists/${listId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
  }

  function remove() {
    onDeleted(cardId);
    fetch(`/api/blocks/${cardId}`, { method: "DELETE" });
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="w-fit rounded-md border border-border bg-transparent px-1 py-1.5 text-sm font-medium outline-none"
      />
    );
  }

  return (
    <div className="group relative w-fit">
      <Link
        href={href}
        className="flex w-fit items-center gap-2 rounded-md px-1 py-1.5 pr-16 text-sm font-medium underline decoration-border underline-offset-4 hover:bg-accent"
      >
        <HugeiconsIcon icon={File01Icon} size={16} className="text-muted-foreground" />
        {name}
      </Link>
      <BlockHoverActions onEdit={() => setEditing(true)} onDelete={remove} />
    </div>
  );
}
