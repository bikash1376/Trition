"use client";

import { useState } from "react";
import { MarkdownEditor } from "@/components/markdown-editor";
import { BlockHoverActions } from "@/components/blocks/block-hover-actions";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";

const SAVE_DEBOUNCE_MS = 10_000;

interface TextBlockProps {
  cardId: string;
  initialContent: string;
  onDeleted: (cardId: string) => void;
}

export function TextBlock({ cardId, initialContent, onDeleted }: TextBlockProps) {
  const [value, setValue] = useState(initialContent);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function save(content: string) {
    await fetch(`/api/blocks/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  }

  const [debouncedSave, flushSave] = useDebouncedCallback(save, SAVE_DEBOUNCE_MS);

  function remove() {
    onDeleted(cardId);
    fetch(`/api/blocks/${cardId}`, { method: "DELETE" });
  }

  function handleBlur() {
    if (value.trim().length === 0) {
      remove();
      return;
    }
    flushSave(value);
  }

  return (
    <div className="group relative">
      <MarkdownEditor
        value={value}
        onChange={(next) => {
          setValue(next);
          debouncedSave(next);
        }}
        onBlur={handleBlur}
        placeholder="Empty text block"
      />
      <BlockHoverActions onDelete={() => setConfirmOpen(true)} />
      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        description="This text block will be permanently deleted."
        onConfirm={remove}
      />
    </div>
  );
}
