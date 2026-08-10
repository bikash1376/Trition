"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { MarkdownEditor, type MarkdownEditorHandle } from "@/components/markdown-editor";
import { BlockHoverActions } from "@/components/blocks/block-hover-actions";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";

const SAVE_DEBOUNCE_MS = 10_000;

export interface TextBlockHandle {
  /** Appends `incoming` to this block's content, saves immediately, and focuses at the old boundary. */
  mergeAppend(incoming: string): void;
}

interface TextBlockProps {
  cardId: string;
  initialContent: string;
  onDeleted: (cardId: string) => void;
  /** Return true if handled (merged into the previous block). */
  onMergeUp?: (content: string) => boolean;
  /** Fired on a 2nd Ctrl/Cmd+A press once this block's text is already fully selected. */
  onSelectAllEscalate?: () => void;
}

export const TextBlock = forwardRef<TextBlockHandle, TextBlockProps>(function TextBlock(
  { cardId, initialContent, onDeleted, onMergeUp, onSelectAllEscalate },
  ref,
) {
  const [value, setValue] = useState(initialContent);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const editorRef = useRef<MarkdownEditorHandle>(null);

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

  useImperativeHandle(
    ref,
    () => ({
      mergeAppend(incoming) {
        const boundary = value.length;
        const next = value + incoming;
        setValue(next);
        flushSave(next);
        editorRef.current?.focus(boundary);
      },
    }),
    [value, flushSave],
  );

  return (
    <div className="group relative">
      <MarkdownEditor
        ref={editorRef}
        value={value}
        onChange={(next) => {
          setValue(next);
          debouncedSave(next);
        }}
        onBlur={handleBlur}
        onBackspaceAtStart={() => onMergeUp?.(value) ?? false}
        onSelectAllEscalate={onSelectAllEscalate}
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
});
