"use client";

import { useRef, useState } from "react";

export function TextBlock({ cardId, initialContent }: { cardId: string; initialContent: string }) {
  const [value, setValue] = useState(initialContent);
  const ref = useRef<HTMLTextAreaElement>(null);

  function resize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  async function save() {
    if (value === initialContent) return;
    await fetch(`/api/blocks/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: value }),
    });
  }

  return (
    <textarea
      ref={(el) => {
        ref.current = el;
        if (el) resize(el);
      }}
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        resize(e.target);
      }}
      onBlur={save}
      rows={1}
      placeholder="Empty text block"
      className="resize-none overflow-hidden border-none bg-transparent py-1 text-sm leading-6 outline-none placeholder:text-muted-foreground"
    />
  );
}
