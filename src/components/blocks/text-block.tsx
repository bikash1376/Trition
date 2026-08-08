"use client";

import { useState } from "react";
import { MarkdownEditor } from "@/components/markdown-editor";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";

const SAVE_DEBOUNCE_MS = 10_000;

export function TextBlock({ cardId, initialContent }: { cardId: string; initialContent: string }) {
  const [value, setValue] = useState(initialContent);

  async function save(content: string) {
    await fetch(`/api/blocks/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  }

  const [debouncedSave, flushSave] = useDebouncedCallback(save, SAVE_DEBOUNCE_MS);

  return (
    <MarkdownEditor
      value={value}
      onChange={(next) => {
        setValue(next);
        debouncedSave(next);
      }}
      onBlur={() => flushSave(value)}
      placeholder="Empty text block"
    />
  );
}
