"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ImageNotFound01Icon } from "@hugeicons/core-free-icons";
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

export function CardAttachments({ cardId, attachments }: { cardId: string; attachments: TrelloAttachment[] }) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {attachments.map((attachment) => {
        const src = `/api/attachments/${cardId}/${attachment.id}`;
        if (isImageAttachment(attachment.mimeType, attachment.name, attachment.url)) {
          return <AttachmentImage key={attachment.id} src={src} alt={attachment.name} url={attachment.url} />;
        }
        if (isVideoAttachment(attachment.mimeType, attachment.name, attachment.url)) {
          return (
            <video key={attachment.id} src={src} controls className="rounded-md border border-border">
              <track kind="captions" />
            </video>
          );
        }
        return (
          <a
            key={attachment.id}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-sm text-primary underline underline-offset-4"
          >
            {attachment.name}
          </a>
        );
      })}
    </div>
  );
}
