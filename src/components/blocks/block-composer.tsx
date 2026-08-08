"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { BookmarkIcon, File01Icon, Image02Icon, Table01Icon, TextIcon } from "@hugeicons/core-free-icons";
import type { TrelloCard, TrelloList } from "@/lib/trello/types";

type PendingType = "page" | "bookmark" | "image" | "table" | null;

interface BlockOption {
  type: "text" | "page" | "bookmark" | "image" | "table";
  label: string;
  icon: IconSvgElement;
}

const OPTIONS: BlockOption[] = [
  { type: "text", label: "Text", icon: TextIcon },
  { type: "page", label: "Page", icon: File01Icon },
  { type: "table", label: "Table", icon: Table01Icon },
  { type: "bookmark", label: "Bookmark", icon: BookmarkIcon },
  { type: "image", label: "Image", icon: Image02Icon },
];

interface BlockComposerProps {
  boardId: string;
  listId: string;
  pages: { id: string; name: string }[];
  onCreated: (card: TrelloCard, list?: TrelloList) => void;
}

export function BlockComposer({ boardId, listId, pages, onCreated }: BlockComposerProps) {
  const [value, setValue] = useState("");
  const [pendingType, setPendingType] = useState<PendingType>(null);
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSlashCommand = !pendingType && value.startsWith("/");
  const query = isSlashCommand ? value.slice(1).toLowerCase() : "";
  const filteredOptions = isSlashCommand ? OPTIONS.filter((o) => o.label.toLowerCase().includes(query)) : [];
  const menuOpen = isSlashCommand && filteredOptions.length > 0;

  const pageSuggestions =
    pendingType === "bookmark" && value.trim().length > 0
      ? pages.filter((p) => p.name.toLowerCase().includes(value.toLowerCase()))
      : [];

  useEffect(() => {
    if (pendingType === "image") fileInputRef.current?.click();
  }, [pendingType]);

  async function submitText(content: string) {
    if (!content.trim()) return;
    setCreating(true);
    const res = await fetch(`/api/lists/${listId}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "text", content }),
    });
    setCreating(false);
    if (!res.ok) return;
    const { card } = await res.json();
    onCreated(card);
    setValue("");
  }

  async function submitPage(name: string) {
    if (!name.trim()) return;
    setCreating(true);
    const res = await fetch(`/api/lists/${listId}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "page", name, boardId }),
    });
    setCreating(false);
    if (!res.ok) return;
    const { card, list } = await res.json();
    onCreated(card, list);
    setValue("");
    setPendingType(null);
  }

  async function submitTable(name: string) {
    if (!name.trim()) return;
    setCreating(true);
    const res = await fetch(`/api/lists/${listId}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "table", name, boardId }),
    });
    setCreating(false);
    if (!res.ok) return;
    const { card, list } = await res.json();
    onCreated(card, list);
    setValue("");
    setPendingType(null);
  }

  async function submitInternalPage(page: { id: string; name: string }) {
    setCreating(true);
    const res = await fetch(`/api/lists/${listId}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "page", name: page.name, existingListId: page.id }),
    });
    setCreating(false);
    if (!res.ok) return;
    const { card, list } = await res.json();
    onCreated(card, list);
    setValue("");
    setPendingType(null);
  }

  async function submitBookmark(url: string) {
    if (!url.trim()) return;
    setCreating(true);
    const res = await fetch(`/api/lists/${listId}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "bookmark", url }),
    });
    setCreating(false);
    if (!res.ok) return;
    const { card } = await res.json();
    onCreated(card);
    setValue("");
    setPendingType(null);
  }

  async function submitImage(file: File) {
    setCreating(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/lists/${listId}/blocks/image`, { method: "POST", body: form });
    setCreating(false);
    setPendingType(null);
    if (!res.ok) return;
    const { card } = await res.json();
    onCreated(card);
  }

  function selectOption(option: BlockOption) {
    if (option.type === "text") {
      setValue("");
      return;
    }
    setPendingType(option.type);
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setPendingType(null);
      setValue("");
      return;
    }
    if (e.key === "Backspace" && pendingType && value === "") {
      setPendingType(null);
      return;
    }
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (pendingType === "page") {
      submitPage(value);
      return;
    }
    if (pendingType === "table") {
      submitTable(value);
      return;
    }
    if (pendingType === "bookmark") {
      if (pageSuggestions.length > 0) {
        submitInternalPage(pageSuggestions[0]);
        return;
      }
      submitBookmark(value);
      return;
    }
    if (menuOpen) {
      selectOption(filteredOptions[0]);
      return;
    }
    submitText(value);
  }

  const placeholder =
    pendingType === "page"
      ? "Page name…"
      : pendingType === "table"
        ? "Table name…"
        : pendingType === "bookmark"
          ? "Paste a link, or search a page…"
          : pendingType === "image"
            ? "Choose an image…"
            : "Type '/' for commands";

  return (
    <div className="relative mt-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={creating || pendingType === "image"}
        placeholder={placeholder}
        className="w-full border-none bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) submitImage(file);
          else setPendingType(null);
          e.target.value = "";
        }}
      />
      {menuOpen && (
        <div className="absolute top-full left-0 z-10 mt-1 w-48 overflow-hidden rounded-md border border-border bg-popover py-1 shadow-md">
          {filteredOptions.map((option) => (
            <button
              key={option.type}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectOption(option)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent"
            >
              <HugeiconsIcon icon={option.icon} size={14} className="text-muted-foreground" />
              {option.label}
            </button>
          ))}
        </div>
      )}
      {pageSuggestions.length > 0 && (
        <div className="absolute top-full left-0 z-10 mt-1 w-64 overflow-hidden rounded-md border border-border bg-popover py-1 shadow-md">
          <p className="px-3 pt-1 pb-0.5 text-[11px] text-muted-foreground">Link to an existing page</p>
          {pageSuggestions.map((page) => (
            <button
              key={page.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => submitInternalPage(page)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent"
            >
              <HugeiconsIcon icon={File01Icon} size={14} className="text-muted-foreground" />
              <span className="truncate">{page.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
