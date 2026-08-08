"use client";

import { useEffect, useState } from "react";
import { CardTable } from "@/components/table/card-table";
import type { TrelloCard, TrelloLabel, TrelloMember } from "@/lib/trello/types";

interface TableData {
  rows: { card: TrelloCard; creator: TrelloMember | null }[];
  members: TrelloMember[];
  labels: TrelloLabel[];
}

export function TableBlock({ listId, name, me }: { listId: string; name: string; me: TrelloMember }) {
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

  if (!data) {
    return <div className="rounded-md border border-border px-3 py-4 text-sm text-muted-foreground">Loading table…</div>;
  }

  return (
    <div className="rounded-md border border-border p-3">
      <CardTable
        listId={listId}
        pageTitle={name}
        rows={data.rows}
        members={data.members}
        labels={data.labels}
        me={me}
        compact
      />
    </div>
  );
}
