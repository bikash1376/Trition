"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { BookmarkIcon, File01Icon, Image02Icon, Table01Icon, TextIcon } from "@hugeicons/core-free-icons";
import { serializeBlock } from "@/lib/trello/blocks";
import { expandLoremAtCursor } from "@/lib/lorem";
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
  onReconciled: (tempId: string, card: TrelloCard | null) => void;
}

export function BlockComposer({ boardId, listId, pages, onCreated, onReconciled }: BlockComposerProps) {
  const [value, setValue] = useState("");
  const [pendingType, setPendingType] = useState<PendingType>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  function submitText(content: string) {
    if (!content.trim()) return;
    setValue("");

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tempCard: TrelloCard = {
      id: tempId,
      name: content.split("\n")[0]?.slice(0, 80) || "Untitled",
      desc: serializeBlock("text", null, content),
      idList: listId,
      idBoard: boardId,
      idMembers: [],
      labels: [],
      due: null,
      closed: false,
      shortUrl: "",
    };
    onCreated(tempCard);

    fetch(`/api/lists/${listId}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "text", content }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => onReconciled(tempId, data?.card ?? null));
  }

  function submitPage(name: string) {
    if (!name.trim()) return;
    setValue("");
    setPendingType(null);
    fetch(`/api/lists/${listId}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "page", name, boardId }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && onCreated(data.card, data.list));
  }

  function submitTable(name: string) {
    if (!name.trim()) return;
    setValue("");
    setPendingType(null);
    fetch(`/api/lists/${listId}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "table", name, boardId }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && onCreated(data.card, data.list));
  }

  function submitInternalPage(page: { id: string; name: string }) {
    setValue("");
    setPendingType(null);
    fetch(`/api/lists/${listId}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "page", name: page.name, existingListId: page.id }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && onCreated(data.card, data.list));
  }

  function submitBookmark(url: string) {
    if (!url.trim()) return;
    setValue("");
    setPendingType(null);
    fetch(`/api/lists/${listId}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "bookmark", url }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && onCreated(data.card));
  }

  function submitImage(file: File) {
    setPendingType(null);
    const form = new FormData();
    form.append("file", file);
    fetch(`/api/lists/${listId}/blocks/image`, { method: "POST", body: form })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && onCreated(data.card));
  }

  function selectOption(option: BlockOption) {
    if (option.type === "text") {
      setValue("");
      return;
    }
    setPendingType(option.type);
    setValue("");
  }

  function handleNameKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setPendingType(null);
      setValue("");
      return;
    }
    if (e.key === "Backspace" && value === "") {
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
    }
  }

  function handleTextKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      setValue("");
      return;
    }
    if (e.key === " " || e.key === "Tab") {
      const el = e.currentTarget;
      const expanded = expandLoremAtCursor(el.value, el.selectionStart);
      if (expanded) {
        e.preventDefault();
        setValue(expanded.value);
        requestAnimationFrame(() => el.setSelectionRange(expanded.cursorPos, expanded.cursorPos));
        return;
      }
    }
    if (e.key !== "Enter") return;
    // Enter selects a highlighted slash-command option; otherwise it's a normal newline
    if (menuOpen) {
      e.preventDefault();
      selectOption(filteredOptions[0]);
    }
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

  const isNameEntry = pendingType === "page" || pendingType === "table" || pendingType === "bookmark";

  return (
    <div className="relative mt-2">
      {isNameEntry ? (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleNameKeyDown}
          autoFocus
          placeholder={placeholder}
          className="w-full border-none bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleTextKeyDown}
          onBlur={() => !menuOpen && submitText(value)}
          disabled={pendingType === "image"}
          placeholder={placeholder}
          rows={1}
          className="w-full resize-none overflow-hidden border-none bg-transparent py-1 text-sm leading-6 outline-none placeholder:text-muted-foreground"
        />
      )}
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
