import { labelColor } from "@/lib/trello/label-colors";
import type { TrelloLabel } from "@/lib/trello/types";

export function StatusPills({ labels }: { labels: TrelloLabel[] }) {
  if (labels.length === 0) {
    return <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">Not started</span>;
  }
  return (
    <>
      {labels.map((label) => (
        <span
          key={label.id}
          className="rounded px-1.5 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: labelColor(label.color) }}
        >
          {label.name}
        </span>
      ))}
    </>
  );
}
