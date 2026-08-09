"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, ImageNotFound01Icon } from "@hugeicons/core-free-icons";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { isImageAttachment, isVideoAttachment } from "@/lib/trello/media-type";
import type { TrelloAttachment } from "@/lib/trello/types";

function AttachmentImage({ src, alt, url }: { src: string; alt: string; url: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <HugeiconsIcon icon={ImageNotFound01Icon} size={16} />
        <span className="truncate">{alt}</span>
      </a>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="rounded-md border border-border"
    />
  );
}

interface CardAttachmentsProps {
  cardId: string;
  attachments: TrelloAttachment[];
  onDeleted: (attachmentId: string) => void;
}

export function CardAttachments({ cardId, attachments, onDeleted }: CardAttachmentsProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (attachments.length === 0) return null;

  function remove(attachmentId: string) {
    onDeleted(attachmentId);
    fetch(`/api/cards/${cardId}/attachments/${attachmentId}`, { method: "DELETE" });
  }

  return (
    <div className="flex flex-col gap-2">
      {attachments.map((attachment) => {
        const src = `/api/attachments/${cardId}/${attachment.id}`;
        return (
          <div key={attachment.id} className="group relative w-fit max-w-full">
            {isImageAttachment(attachment.mimeType, attachment.name, attachment.url) ? (
              <AttachmentImage src={src} alt={attachment.name} url={attachment.url} />
            ) : isVideoAttachment(attachment.mimeType, attachment.name, attachment.url) ? (
              <video src={src} controls className="rounded-md border border-border">
                <track kind="captions" />
              </video>
            ) : (
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate pr-6 text-sm text-primary underline underline-offset-4"
              >
                {attachment.name}
              </a>
            )}
            <button
              type="button"
              onClick={() => setDeleteConfirmId(attachment.id)}
              className="absolute top-1 right-1 flex items-center justify-center rounded-md border border-border bg-popover p-1 text-muted-foreground opacity-100 shadow-sm hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
            >
              <HugeiconsIcon icon={Delete02Icon} size={13} />
            </button>
          </div>
        );
      })}
      <ConfirmDeleteDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        description="This attachment will be permanently deleted."
        onConfirm={() => {
          if (deleteConfirmId) remove(deleteConfirmId);
        }}
      />
    </div>
  );
}
