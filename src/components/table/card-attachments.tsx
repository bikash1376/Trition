import type { TrelloAttachment } from "@/lib/trello/types";

export function CardAttachments({ cardId, attachments }: { cardId: string; attachments: TrelloAttachment[] }) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {attachments.map((attachment) => {
        const src = `/api/attachments/${cardId}/${attachment.id}`;
        if (attachment.mimeType?.startsWith("image/")) {
          // eslint-disable-next-line @next/next/no-img-element
          return <img key={attachment.id} src={src} alt={attachment.name} className="rounded-md border border-border" />;
        }
        if (attachment.mimeType?.startsWith("video/")) {
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
