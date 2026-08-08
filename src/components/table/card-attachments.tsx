import { isImageAttachment, isVideoAttachment } from "@/lib/trello/media-type";
import type { TrelloAttachment } from "@/lib/trello/types";

export function CardAttachments({ cardId, attachments }: { cardId: string; attachments: TrelloAttachment[] }) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {attachments.map((attachment) => {
        const src = `/api/attachments/${cardId}/${attachment.id}`;
        if (isImageAttachment(attachment.mimeType, attachment.name, attachment.url)) {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={attachment.id}
              src={src}
              alt={attachment.name}
              loading="lazy"
              className="rounded-md border border-border"
            />
          );
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
