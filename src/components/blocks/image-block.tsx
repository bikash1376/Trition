"use client";

import { BlockHoverActions } from "@/components/blocks/block-hover-actions";

interface ImageBlockProps {
  cardId: string;
  attachmentId: string | null;
  alt: string;
  onDeleted: (cardId: string) => void;
}

export function ImageBlock({ cardId, attachmentId, alt, onDeleted }: ImageBlockProps) {
  function remove() {
    onDeleted(cardId);
    fetch(`/api/blocks/${cardId}`, { method: "DELETE" });
  }

  if (!attachmentId) {
    return <p className="text-sm text-muted-foreground italic">Image failed to upload</p>;
  }

  return (
    <div className="group relative w-fit max-w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/attachments/${cardId}/${attachmentId}`}
        alt={alt}
        loading="lazy"
        className="max-w-full rounded-md border border-border"
      />
      <BlockHoverActions onDelete={remove} />
    </div>
  );
}
