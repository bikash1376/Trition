"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarStack } from "@/components/table/avatar-stack";
import { CardDetailSheet } from "@/components/table/card-detail-sheet";
import { LabelPicker } from "@/components/table/label-picker";
import { labelColor } from "@/lib/trello/label-colors";
import type { TrelloCard, TrelloLabel, TrelloMember } from "@/lib/trello/types";

const URL_RE = /^https?:\/\/\S+$/;

interface CardRow {
  card: TrelloCard;
  creator: TrelloMember | null;
}

interface CardTableProps {
  listId: string;
  pageTitle: string;
  rows: CardRow[];
  members: TrelloMember[];
  labels: TrelloLabel[];
}

export function CardTable({ listId, pageTitle, rows: initialRows, members, labels }: CardTableProps) {
  const [rows, setRows] = useState(initialRows);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [newCardName, setNewCardName] = useState("");
  const [adding, setAdding] = useState(false);

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  async function addCard() {
    const name = newCardName.trim();
    if (!name) return;
    setAdding(true);
    const res = await fetch(`/api/lists/${listId}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setAdding(false);
    if (!res.ok) return;
    const { card } = await res.json();
    setRows((prev) => [...prev, { card, creator: null }]);
    setNewCardName("");
  }

  async function deleteCard(cardId: string) {
    setRows((prev) => prev.filter((r) => r.card.id !== cardId));
    await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
  }

  function handleRenamed(cardId: string, name: string) {
    setRows((prev) => prev.map((r) => (r.card.id === cardId ? { ...r, card: { ...r.card, name } } : r)));
  }

  function handleArchived(cardId: string) {
    setRows((prev) => prev.filter((r) => r.card.id !== cardId));
  }

  function handleLabelsChanged(cardId: string, cardLabels: TrelloLabel[]) {
    setRows((prev) => prev.map((r) => (r.card.id === cardId ? { ...r, card: { ...r.card, labels: cardLabels } } : r)));
  }

  return (
    <div className="flex h-full flex-col px-8 py-8">
      <h1 className="mb-6 text-2xl font-bold">{pageTitle}</h1>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
              <th className="w-8 px-2 py-2"></th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Members</th>
              <th className="px-3 py-2 font-medium">Created By</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ card, creator }) => {
              const isLinkCard = URL_RE.test(card.name.trim());
              return (
                <tr
                  key={card.id}
                  onClick={() => setSelectedCardId(card.id)}
                  className="group cursor-pointer border-b border-border last:border-b-0 hover:bg-muted/40"
                >
                  <td className="px-2 py-2 text-left">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCard(card.id);
                      }}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={14} className="text-muted-foreground hover:text-destructive" />
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    {isLinkCard ? (
                      <a
                        href={card.name.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary underline underline-offset-4"
                      >
                        {card.name}
                      </a>
                    ) : (
                      card.name
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <LabelPicker
                      cardId={card.id}
                      selected={card.labels}
                      options={labels}
                      onChange={(next) => handleLabelsChanged(card.id, next)}
                    >
                      <div className="flex min-h-5 flex-wrap gap-1">
                        {card.labels.length === 0 && (
                          <span className="text-xs text-muted-foreground">Empty</span>
                        )}
                        {card.labels.map((label) => (
                          <span
                            key={label.id}
                            className="rounded px-1.5 py-0.5 text-xs font-medium text-white"
                            style={{ backgroundColor: labelColor(label.color) }}
                          >
                            {label.name || label.color}
                          </span>
                        ))}
                      </div>
                    </LabelPicker>
                  </td>
                  <td className="px-3 py-2">
                    <AvatarStack members={card.idMembers.map((id) => memberById.get(id)).filter((m): m is TrelloMember => !!m)} />
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-muted-foreground">{creator?.fullName ?? "—"}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex items-center gap-2 border-t border-border px-3 py-2">
          <HugeiconsIcon icon={Add01Icon} size={14} className="shrink-0 text-muted-foreground" />
          <Input
            value={newCardName}
            onChange={(e) => setNewCardName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCard()}
            placeholder="New card"
            disabled={adding}
            className="h-7 border-none px-0 shadow-none focus-visible:ring-0"
          />
          {newCardName.trim().length > 0 && (
            <Button size="sm" onClick={addCard} disabled={adding}>
              Add
            </Button>
          )}
        </div>
      </div>

      <CardDetailSheet
        cardId={selectedCardId}
        onOpenChange={(open) => !open && setSelectedCardId(null)}
        onRenamed={handleRenamed}
        onArchived={handleArchived}
      />
    </div>
  );
}
