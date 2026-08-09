"use client";

import { useState } from "react";
import { parseBlock, serializeBlock } from "@/lib/trello/blocks";
import type { TrelloBoardMembership, TrelloCard, TrelloLabel, TrelloList, TrelloMember } from "@/lib/trello/types";
import { BlockComposer } from "@/components/blocks/block-composer";
import { BookmarkBlock } from "@/components/blocks/bookmark-block";
import { ImageBlock } from "@/components/blocks/image-block";
import { PageBlock } from "@/components/blocks/page-block";
import { TableBlock } from "@/components/blocks/table-block";
import { TextBlock } from "@/components/blocks/text-block";
import { CardTable, type CardRow } from "@/components/table/card-table";
import { EditableTitle } from "@/components/shell/editable-title";
import { InviteButton } from "@/components/shell/invite-button";
import { WorkspaceMembers } from "@/components/shell/workspace-members";
import { BoardSettingsSheet, type BoardCover } from "@/components/shell/board-settings-sheet";
import type { ColumnDef } from "@/lib/trello/columns";

interface BlockCanvasProps {
  boardId: string;
  listId: string;
  pageHrefBase: string;
  pageTitle: string;
  cards: TrelloCard[];
  pageNames: Record<string, string>;
  me?: TrelloMember;
  titleEditable?: boolean;
  inviteBoardId?: string;
  workspaceMemberships?: TrelloBoardMembership[];
  tableRows?: CardRow[];
  tableMembers?: TrelloMember[];
  tableLabels?: TrelloLabel[];
  tableColumns?: ColumnDef[];
  cover?: BoardCover | null;
}

export function BlockCanvas({
  boardId,
  listId,
  pageHrefBase,
  pageTitle,
  cards: initialCards,
  pageNames: initialPageNames,
  me,
  titleEditable,
  inviteBoardId,
  workspaceMemberships,
  tableRows,
  tableMembers,
  tableLabels,
  tableColumns,
  cover: initialCover,
}: BlockCanvasProps) {
  const [cards, setCards] = useState(initialCards);
  const [pageNames, setPageNames] = useState(initialPageNames);
  const [pending, setPending] = useState<{ id: string; kind: "table" | "bookmark" }[]>([]);
  const [cover, setCover] = useState<BoardCover | null>(initialCover ?? null);

  function handleCreated(card: TrelloCard, list?: TrelloList) {
    setCards((prev) => [...prev, card]);
    if (list) setPageNames((prev) => ({ ...prev, [list.id]: list.name }));
  }

  function handlePending(tempId: string, kind: "table" | "bookmark") {
    setPending((prev) => [...prev, { id: tempId, kind }]);
  }

  function handlePendingResolved(tempId: string) {
    setPending((prev) => prev.filter((p) => p.id !== tempId));
  }

  function handleReconciled(tempId: string, card: TrelloCard | null) {
    setCards((prev) => (card ? prev.map((c) => (c.id === tempId ? card : c)) : prev.filter((c) => c.id !== tempId)));
  }

  function handleBlockDeleted(cardId: string) {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  }

  function handlePageRenamed(renamedListId: string, name: string) {
    setPageNames((prev) => ({ ...prev, [renamedListId]: name }));
  }

  function handleBookmarkEdited(cardId: string, url: string, title: string) {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, name: title, desc: serializeBlock("bookmark", url, "") } : c)),
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {cover && (
        <div className="relative w-full shrink-0 overflow-hidden" style={{ height: `${cover.heightPercent}vh` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/attachments/${cover.cardId}/${cover.attachmentId}`}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-1 px-10 py-12">
        <div className="mb-6 flex w-full max-w-3xl items-center justify-between">
          {titleEditable ? (
            <EditableTitle listId={listId} initialName={pageTitle} className="text-3xl font-bold" />
          ) : (
            <h1 className="text-3xl font-bold">{pageTitle}</h1>
          )}
          {inviteBoardId && (
            <div className="flex items-center gap-2">
              {workspaceMemberships && <WorkspaceMembers memberships={workspaceMemberships} />}
              <InviteButton boardId={inviteBoardId} />
              <BoardSettingsSheet
                boardId={inviteBoardId}
                homeListId={listId}
                cover={cover}
                onCoverChanged={setCover}
              />
            </div>
          )}
        </div>

        {tableRows && tableRows.length > 0 && me && (
          <div className="mb-4 w-full">
            <CardTable
              listId={listId}
              pageTitle={pageTitle}
              rows={tableRows}
              members={tableMembers ?? []}
              labels={tableLabels ?? []}
              columns={tableColumns ?? []}
              me={me}
              compact
              showTitle={false}
            />
          </div>
        )}

        <div className="flex w-full max-w-3xl flex-col gap-1">
          {cards.map((card) => {
            const block = parseBlock(card.desc);
            if (block.type === "page" && block.ref) {
              return (
                <PageBlock
                  key={card.id}
                  cardId={card.id}
                  listId={block.ref}
                  href={`${pageHrefBase}/l/${block.ref}`}
                  name={pageNames[block.ref] ?? card.name}
                  onRenamed={handlePageRenamed}
                  onDeleted={handleBlockDeleted}
                />
              );
            }
            if (block.type === "table" && block.ref && me) {
              return (
                <TableBlock
                  key={card.id}
                  cardId={card.id}
                  listId={block.ref}
                  name={pageNames[block.ref] ?? card.name}
                  me={me}
                  onDeleted={handleBlockDeleted}
                />
              );
            }
            if (block.type === "bookmark" && block.ref) {
              return (
                <BookmarkBlock
                  key={card.id}
                  cardId={card.id}
                  url={block.ref}
                  title={card.name}
                  onEdited={handleBookmarkEdited}
                  onDeleted={handleBlockDeleted}
                />
              );
            }
            if (block.type === "image") {
              return (
                <ImageBlock
                  key={card.id}
                  cardId={card.id}
                  attachmentId={block.ref}
                  alt={card.name}
                  onDeleted={handleBlockDeleted}
                />
              );
            }
            return (
              <TextBlock key={card.id} cardId={card.id} initialContent={block.content} onDeleted={handleBlockDeleted} />
            );
          })}

          {pending.map((p) =>
            p.kind === "table" ? (
              <div key={p.id} className="flex flex-col gap-2 rounded-md border border-border p-3">
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                <div className="h-24 w-full animate-pulse rounded-md bg-muted" />
              </div>
            ) : (
              <div key={p.id} className="h-14 w-full max-w-md animate-pulse rounded-md border border-border bg-muted/40" />
            ),
          )}

          <BlockComposer
            boardId={boardId}
            listId={listId}
            pages={Object.entries(pageNames).map(([id, name]) => ({ id, name }))}
            onCreated={handleCreated}
            onReconciled={handleReconciled}
            onPending={handlePending}
            onPendingResolved={handlePendingResolved}
          />
        </div>
      </div>
    </div>
  );
}
