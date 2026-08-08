"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { BookmarkIcon } from "@hugeicons/core-free-icons";
import { BlockHoverActions } from "@/components/blocks/block-hover-actions";

interface BookmarkBlockProps {
  cardId: string;
  url: string;
  title: string;
  onEdited: (cardId: string, url: string, title: string) => void;
  onDeleted: (cardId: string) => void;
}

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function BookmarkBlock({ cardId, url, title, onEdited, onDeleted }: BookmarkBlockProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(url);

  function save() {
    setEditing(false);
    const trimmed = value.trim();
    if (!trimmed || trimmed === url) {
      setValue(url);
      return;
    }
    const nextUrl = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
    const nextTitle = hostnameOf(nextUrl);
    onEdited(cardId, nextUrl, nextTitle);
    fetch(`/api/blocks/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "bookmark", ref: nextUrl, content: "", name: nextTitle }),
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
        className="w-full max-w-md rounded-md border border-border px-3 py-2.5 text-sm outline-none"
      />
    );
  }

  return (
    <div className="group relative w-fit max-w-full">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col gap-1 rounded-md border border-border px-3 py-2.5 pr-16 text-sm hover:bg-accent"
      >
        <span className="flex items-center gap-2 font-medium">
          <HugeiconsIcon icon={BookmarkIcon} size={14} className="shrink-0 text-muted-foreground" />
          {title}
        </span>
        <span className="truncate text-xs text-muted-foreground">{hostnameOf(url)}</span>
      </a>
      <BlockHoverActions onEdit={() => setEditing(true)} onDelete={remove} />
    </div>
  );
}
