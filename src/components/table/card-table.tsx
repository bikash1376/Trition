"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Delete02Icon,
  FilterIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CardDetailSheet } from "@/components/table/card-detail-sheet";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { LabelPicker } from "@/components/table/label-picker";
import { MemberPicker } from "@/components/table/member-picker";
import { StatusPills } from "@/components/table/status-pills";
import { EditableTitle } from "@/components/shell/editable-title";
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
  me: TrelloMember;
  compact?: boolean;
  showTitle?: boolean;
  headerActions?: React.ReactNode;
}

type SortKey = "name" | "status" | "members" | "createdBy";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "status", label: "Status" },
  { key: "members", label: "Members" },
  { key: "createdBy", label: "Created By" },
];

export function CardTable({
  listId,
  pageTitle,
  rows: initialRows,
  members,
  labels,
  me,
  compact,
  showTitle = true,
  headerActions,
}: CardTableProps) {
  const [rows, setRows] = useState(initialRows);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [newCardName, setNewCardName] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null);
  const [filterLabelIds, setFilterLabelIds] = useState<Set<string>>(new Set());
  const [filterMemberIds, setFilterMemberIds] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  function cardMembers(card: TrelloCard) {
    return card.idMembers.map((id) => memberById.get(id)).filter((m): m is TrelloMember => !!m);
  }

  const visibleRows = useMemo(() => {
    let next = rows;

    if (filterLabelIds.size > 0) {
      next = next.filter((r) => r.card.labels.some((l) => filterLabelIds.has(l.id)));
    }
    if (filterMemberIds.size > 0) {
      next = next.filter((r) => r.card.idMembers.some((id) => filterMemberIds.has(id)));
    }

    if (sort) {
      const dir = sort.dir === "asc" ? 1 : -1;
      next = [...next].sort((a, b) => {
        const valueOf = (r: CardRow) => {
          switch (sort.key) {
            case "name":
              return r.card.name.toLowerCase();
            case "status":
              return r.card.labels[0]?.name.toLowerCase() ?? "";
            case "members":
              return cardMembers(r.card)[0]?.fullName.toLowerCase() ?? "";
            case "createdBy":
              return r.creator?.fullName.toLowerCase() ?? "";
          }
        };
        return valueOf(a) < valueOf(b) ? -dir : valueOf(a) > valueOf(b) ? dir : 0;
      });
    }

    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort, filterLabelIds, filterMemberIds]);

  function toggleSort(key: SortKey) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  function toggleFilterLabel(labelId: string) {
    setFilterLabelIds((prev) => {
      const next = new Set(prev);
      if (next.has(labelId)) next.delete(labelId);
      else next.add(labelId);
      return next;
    });
  }

  function toggleFilterMember(memberId: string) {
    setFilterMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  }

  function addCard() {
    const name = newCardName.trim();
    if (!name) return;
    setNewCardName("");

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tempCard: TrelloCard = {
      id: tempId,
      name,
      desc: "",
      idList: listId,
      idBoard: "",
      idMembers: [me.id],
      labels: [],
      due: null,
      closed: false,
      shortUrl: "",
    };
    setRows((prev) => [...prev, { card: tempCard, creator: me }]);

    fetch(`/api/lists/${listId}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) {
          setRows((prev) => prev.filter((r) => r.card.id !== tempId));
          return;
        }
        setRows((prev) =>
          prev.map((r) => (r.card.id === tempId ? { card: { ...data.card, idMembers: [me.id] }, creator: me } : r)),
        );
        fetch(`/api/cards/${data.card.id}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: me.id, add: true }),
        });
      });
  }

  function deleteCard(cardId: string) {
    setRows((prev) => prev.filter((r) => r.card.id !== cardId));
    fetch(`/api/cards/${cardId}`, { method: "DELETE" });
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

  function handleMembersChanged(cardId: string, next: TrelloMember[]) {
    setRows((prev) =>
      prev.map((r) => (r.card.id === cardId ? { ...r, card: { ...r.card, idMembers: next.map((m) => m.id) } } : r)),
    );
  }

  return (
    <div className={compact ? "flex flex-col" : "flex h-full flex-col px-8 py-8"}>
      <div className={`group mb-4 flex items-center ${showTitle ? "justify-between" : "justify-end"}`}>
        {showTitle && (
          <EditableTitle
            listId={listId}
            initialName={pageTitle}
            className={compact ? "text-lg font-semibold" : "text-2xl font-bold"}
          />
        )}
        <div className="flex items-center gap-1.5">
          {rows.length > 0 && (
            <Popover>
              <PopoverTrigger
                render={<Button variant="outline" size="sm" className="gap-1.5" />}
              >
                <HugeiconsIcon icon={FilterIcon} size={14} />
                Filter
                {(filterLabelIds.size > 0 || filterMemberIds.size > 0) && (
                  <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                    {filterLabelIds.size + filterMemberIds.size}
                  </span>
                )}
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-2">
                <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">Status</p>
                <div className="mb-2 flex flex-col gap-0.5">
                  {labels
                    .filter((l) => l.name.trim().length > 0)
                    .map((label) => (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() => toggleFilterLabel(label.id)}
                        className="flex items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-accent"
                      >
                        <input type="checkbox" readOnly checked={filterLabelIds.has(label.id)} className="pointer-events-none" />
                        {label.name}
                      </button>
                    ))}
                </div>
                <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">Members</p>
                <div className="flex flex-col gap-0.5">
                  {members.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleFilterMember(member.id)}
                      className="flex items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-accent"
                    >
                      <input type="checkbox" readOnly checked={filterMemberIds.has(member.id)} className="pointer-events-none" />
                      {member.fullName}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
          {headerActions}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
              <th className="w-8 px-2 py-2"></th>
              {COLUMNS.map((col) => (
                <th key={col.key} className="px-3 py-2 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    {col.label}
                    {sort?.key === col.key && (
                      <HugeiconsIcon icon={sort.dir === "asc" ? ArrowUp01Icon : ArrowDown01Icon} size={12} />
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(({ card, creator }) => {
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
                        setDeleteConfirmId(card.id);
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
                        <StatusPills labels={card.labels} />
                      </div>
                    </LabelPicker>
                  </td>
                  <td className="px-3 py-2">
                    <MemberPicker
                      cardId={card.id}
                      selected={cardMembers(card)}
                      options={members}
                      onChange={(next) => handleMembersChanged(card.id, next)}
                    />
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
            className="h-7 border-none px-0 shadow-none focus-visible:ring-0"
          />
          {newCardName.trim().length > 0 && (
            <Button size="sm" onClick={addCard}>
              Add
            </Button>
          )}
        </div>
      </div>

      <CardDetailSheet
        cardId={selectedCardId}
        boardMembers={members}
        me={me}
        onOpenChange={(open) => !open && setSelectedCardId(null)}
        onRenamed={handleRenamed}
        onArchived={handleArchived}
        onMembersChanged={handleMembersChanged}
      />

      <ConfirmDeleteDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        description="This card will be permanently deleted."
        onConfirm={() => {
          if (deleteConfirmId) deleteCard(deleteConfirmId);
        }}
      />
    </div>
  );
}
