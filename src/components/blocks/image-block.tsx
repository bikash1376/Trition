"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ImageNotFound01Icon } from "@hugeicons/core-free-icons";
import { BlockHoverActions } from "@/components/blocks/block-hover-actions";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

interface ImageBlockProps {
  cardId: string;
  attachmentId: string | null;
  alt: string;
  onDeleted: (cardId: string) => void;
}

export function ImageBlock({ cardId, attachmentId, alt, onDeleted }: ImageBlockProps) {
  const [failed, setFailed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function remove() {
    onDeleted(cardId);
    fetch(`/api/blocks/${cardId}`, { method: "DELETE" });
  }

  if (!attachmentId) {
    return <p className="text-sm text-muted-foreground italic">Image failed to upload</p>;
  }

  return (
    <div className="group relative w-fit max-w-full">
      {failed ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <HugeiconsIcon icon={ImageNotFound01Icon} size={16} />
          <span className="truncate">{alt || "Image unavailable"}</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/attachments/${cardId}/${attachmentId}`}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="max-w-full rounded-md border border-border"
        />
      )}
      <BlockHoverActions onDelete={() => setConfirmOpen(true)} />
      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        description="This image will be permanently deleted."
        onConfirm={remove}
      />
    </div>
  );
}
