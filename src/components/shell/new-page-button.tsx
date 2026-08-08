"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";

export function NewPageButton({ boardId, pageHrefBase }: { boardId: string; pageHrefBase: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    const res = await fetch(`/api/boards/${boardId}/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setCreating(false);
    if (!res.ok) return;
    const { list } = await res.json();
    setOpen(false);
    setName("");
    router.push(`${pageHrefBase}/l/${list.id}`);
    router.refresh();
  }

  if (open) {
    return (
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && create()}
        onBlur={() => {
          if (!name.trim()) setOpen(false);
        }}
        disabled={creating}
        placeholder="Page name…"
        className="w-24 rounded border-none bg-sidebar-accent px-1.5 py-0.5 text-xs outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
    >
      <HugeiconsIcon icon={Add01Icon} size={11} />
      New
    </button>
  );
}
