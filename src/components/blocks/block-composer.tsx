"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { AiMagicIcon, BookmarkIcon, File01Icon, Image02Icon, Table01Icon, TextIcon, ArtboardToolIcon } from "@hugeicons/core-free-icons";
import { Spinner } from "@/components/ui/spinner";
import { serializeBlock } from "@/lib/trello/blocks";
import { generateLorem } from "@/lib/lorem";
import { useSidebarRefresh } from "@/lib/sidebar-refresh";
import type { TrelloCard, TrelloList } from "@/lib/trello/types";

type PendingType = "page" | "bookmark" | "image" | "table" | "lorem" | "canvas" | null;

interface BlockOption {
  type: "text" | "page" | "bookmark" | "image" | "table" | "lorem" | "canvas";
  label: string;
  icon: IconSvgElement;
}

const OPTIONS: BlockOption[] = [
  { type: "text", label: "Text", icon: TextIcon },
  { type: "page", label: "Page", icon: File01Icon },
  { type: "table", label: "Table", icon: Table01Icon },
  { type: "bookmark", label: "Bookmark", icon: BookmarkIcon },
  { type: "image", label: "Image", icon: Image02Icon },
  { type: "canvas", label: "Canvas", icon: ArtboardToolIcon },
  { type: "lorem", label: "Lorem ipsum", icon: AiMagicIcon },
];

const LOREM_SLASH_RE = /^\/lorem(\d+)$/i;

interface BlockComposerProps {
  boardId: string;
  listId: string;
  pages: { id: string; name: string }[];
  onCreated: (card: TrelloCard, list?: TrelloList) => void;
  onReconciled: (tempId: string, card: TrelloCard | null) => void;
  onPending?: (tempId: string, kind: "table" | "bookmark") => void;
  onPendingResolved?: (tempId: string) => void;
}

export function BlockComposer({
  boardId,
  listId,
  pages,
  onCreated,
  onReconciled,
  onPending,
  onPendingResolved,
}: BlockComposerProps) {
  const router = useRouter();
  const { refreshSidebar } = useSidebarRefresh();
  const [value, setValue] = useState("");
  const [pendingType, setPendingType] = useState<PendingType>(null);
  const [isSubmittingCanvas, setIsSubmittingCanvas] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Slash-commands trigger off the current line only, so "/" still works after
  // typing some text and pressing Enter, not just at the very start of the input.
  const lastNewlineIdx = value.lastIndexOf("\n");
  const currentLine = lastNewlineIdx >= 0 ? value.slice(lastNewlineIdx + 1) : value;
  const precedingText = lastNewlineIdx >= 0 ? value.slice(0, lastNewlineIdx) : "";

  const isSlashCommand = !pendingType && currentLine.startsWith("/");
  const query = isSlashCommand ? currentLine.slice(1).toLowerCase() : "";
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
      .then((data) => {
        if (data) {
          onCreated(data.card, data.list);
          refreshSidebar();
        }
      });
  }

  async function submitCanvas(name: string) {
    if (!name.trim()) return;
    setIsSubmittingCanvas(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type: "canvas" }),
      });
      const data = res.ok ? await res.json() : null;
      if (!data?.list) return;
      try {
        refreshSidebar();
      } catch {}
      router.push(`/canvas?listId=${data.list.id}&boardId=${boardId}`);
    } catch (err) {
      console.error("Canvas creation failed:", err);
    } finally {
      setIsSubmittingCanvas(false);
      setPendingType(null);
      setValue("");
    }
  }

  function submitTable(name: string) {
    if (!name.trim()) return;
    setValue("");
    setPendingType(null);
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    onPending?.(tempId, "table");
    fetch(`/api/lists/${listId}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "table", name, boardId }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        onPendingResolved?.(tempId);
        if (data) {
          onCreated(data.card, data.list);
          refreshSidebar();
        }
      });
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
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    onPending?.(tempId, "bookmark");
    fetch(`/api/lists/${listId}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "bookmark", url }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        onPendingResolved?.(tempId);
        if (data) onCreated(data.card);
      });
  }

  function submitLorem(countStr: string) {
    const count = parseInt(countStr, 10);
    setPendingType(null);
    if (!count) return;
    submitText(generateLorem(count));
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
      // Dismiss the slash-command on this line only — keep any text typed on earlier lines
      setValue(precedingText ? `${precedingText}\n` : "");
      return;
    }
    if (option.type === "canvas") {
      // use the built-in name entry UI for canvas
      submitText(precedingText);
      setPendingType("canvas");
      setValue("");
      return;
    }
    submitText(precedingText); // commit text typed before this line as its own block
    setPendingType(option.type);
    setValue("");
  }

  function handleNameKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setPendingType(null);
      setValue("");
      return;
    }
    if (e.key === "Backspace" && value.trim() === "") {
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
    if (pendingType === "canvas") {
      submitCanvas(value);
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
    if (pendingType === "lorem") {
      submitLorem(value);
    }
  }

  function handleTextKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      setValue("");
      return;
    }
    if (e.key !== "Enter") return;
    // "/lorem25" + Enter generates directly, bypassing the menu
    const loremMatch = currentLine.match(LOREM_SLASH_RE);
    if (loremMatch) {
      e.preventDefault();
      submitText(precedingText); // commit text typed before this line as its own block
      submitLorem(loremMatch[1]);
      return;
    }
    // Enter selects a highlighted slash-command option; otherwise it's a normal newline
    if (menuOpen) {
      e.preventDefault();
      selectOption(filteredOptions[0]);
    }
  }

  const placeholder =
    pendingType === "page"
      ? "Page name…"
       : pendingType === "canvas"
         ? "Canvas name…"
      : pendingType === "table"
        ? "Table name…"
        : pendingType === "bookmark"
          ? "Paste a link, or search a page…"
          : pendingType === "image"
            ? "Choose an image…"
            : pendingType === "lorem"
              ? "How many words?"
              : "Type '/' for commands";

  const isNameEntry =
    pendingType === "page" || pendingType === "table" || pendingType === "bookmark" || pendingType === "lorem" || pendingType === "canvas";

  return (
    <div className="relative mt-2">
      {isNameEntry ? (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleNameKeyDown}
          autoFocus
          inputMode={pendingType === "lorem" ? "numeric" : undefined}
          placeholder={placeholder}
          onBlur={() => setPendingType(null)}
          disabled={isSubmittingCanvas}
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
      {pendingType === "canvas" && isSubmittingCanvas && (
        <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-2 rounded-full bg-background/80 px-2 py-1 text-xs text-muted-foreground shadow-sm">
          <Spinner className="size-3" />
          Creating canvas…
        </div>
      )}
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
