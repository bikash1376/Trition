import { HugeiconsIcon } from "@hugeicons/react";
import { BookmarkIcon } from "@hugeicons/core-free-icons";

export function BookmarkBlock({ url, title }: { url: string; title: string }) {
  let hostname = url;
  try {
    hostname = new URL(url).hostname;
  } catch {
    // fall back to the raw url as display text
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-fit max-w-full flex-col gap-1 rounded-md border border-border px-3 py-2.5 text-sm hover:bg-accent"
    >
      <span className="flex items-center gap-2 font-medium">
        <HugeiconsIcon icon={BookmarkIcon} size={14} className="shrink-0 text-muted-foreground" />
        {title}
      </span>
      <span className="truncate text-xs text-muted-foreground">{hostname}</span>
    </a>
  );
}
