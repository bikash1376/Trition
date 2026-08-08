"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { CardTable } from "@/components/table/card-table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { TrelloCard, TrelloLabel, TrelloMember } from "@/lib/trello/types";

interface TableData {
  rows: { card: TrelloCard; creator: TrelloMember | null }[];
  members: TrelloMember[];
  labels: TrelloLabel[];
}

interface TableBlockProps {
  cardId: string;
  listId: string;
  name: string;
  me: TrelloMember;
  onDeleted: (cardId: string) => void;
}

export function TableBlock({ cardId, listId, name, me, onDeleted }: TableBlockProps) {
  const [data, setData] = useState<TableData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/lists/${listId}/table-data`)
      .then((res) => res.json())
      .then((json: TableData) => {
        if (!cancelled) setData(json);
      });
    return () => {
      cancelled = true;
    };
  }, [listId]);

  function remove() {
    onDeleted(cardId);
    fetch(`/api/blocks/${cardId}`, { method: "DELETE" });
  }

  const deleteAction = (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={remove}
            className="rounded p-1 text-muted-foreground opacity-0 hover:bg-accent hover:text-destructive group-hover:opacity-100"
          />
        }
      >
        <HugeiconsIcon icon={Delete02Icon} size={13} />
      </TooltipTrigger>
      <TooltipContent>Delete table</TooltipContent>
    </Tooltip>
  );

  return (
    <div className="rounded-md border border-border p-3">
      {!data ? (
        <p className="text-sm text-muted-foreground">Loading table…</p>
      ) : (
        <CardTable
          listId={listId}
          pageTitle={name}
          rows={data.rows}
          members={data.members}
          labels={data.labels}
          me={me}
          compact
          headerActions={deleteAction}
        />
      )}
    </div>
  );
}
