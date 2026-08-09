"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { CardTable, type CardRow } from "@/components/table/card-table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import type { TrelloLabel, TrelloMember } from "@/lib/trello/types";
import type { ColumnDef } from "@/lib/trello/columns";

interface TableData {
  rows: CardRow[];
  members: TrelloMember[];
  labels: TrelloLabel[];
  columns: ColumnDef[];
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
  const [confirmOpen, setConfirmOpen] = useState(false);

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
            onClick={() => setConfirmOpen(true)}
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
        <div className="flex flex-col gap-2 p-1">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="h-24 w-full animate-pulse rounded-md bg-muted" />
        </div>
      ) : (
        <CardTable
          listId={listId}
          pageTitle={name}
          rows={data.rows}
          members={data.members}
          labels={data.labels}
          columns={data.columns}
          me={me}
          compact
          headerActions={deleteAction}
        />
      )}
      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete table "${name}"?`}
        description="This table and all its cards will be permanently deleted."
        confirmLabel="Delete table"
        onConfirm={remove}
      />
    </div>
  );
}
