"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { parseBlock, serializeBlock } from "@/lib/trello/blocks";
import type { TrelloBoardMembership, TrelloCard, TrelloLabel, TrelloList, TrelloMember } from "@/lib/trello/types";
import { BlockComposer } from "@/components/blocks/block-composer";
import { BookmarkBlock } from "@/components/blocks/bookmark-block";
import { ImageBlock } from "@/components/blocks/image-block";
import { PageBlock } from "@/components/blocks/page-block";
import { TableBlock } from "@/components/blocks/table-block";
import { TextBlock, type TextBlockHandle } from "@/components/blocks/text-block";
import { CardTable, type CardRow } from "@/components/table/card-table";
import { EditableTitle } from "@/components/shell/editable-title";
import { InviteButton } from "@/components/shell/invite-button";
import { WorkspaceMembers } from "@/components/shell/workspace-members";
import { BoardSettingsSheet, type BoardCover } from "@/components/shell/board-settings-sheet";
import { LobbyButton } from "@/components/shell/lobby-button";
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
  const [allSelected, setAllSelected] = useState(false);
  const textBlockRefs = useRef(new Map<string, TextBlockHandle>());

  // Backspace at the start of a text block merges it into the previous text
  // block (Google-Docs-style paragraph joining). Non-text neighbors are a no-op.
  function handleMergeUp(cardId: string, content: string): boolean {
    const idx = cards.findIndex((c) => c.id === cardId);
    if (idx <= 0) return false;
    const prevCard = cards[idx - 1];
    if (parseBlock(prevCard.desc).type !== "text") return false;
    const prevHandle = textBlockRefs.current.get(prevCard.id);
    if (!prevHandle) return false; // ref not registered yet — fail safe, no-op
    prevHandle.mergeAppend(content);
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    fetch(`/api/blocks/${cardId}`, { method: "DELETE" });
    return true;
  }

  // A 2nd Ctrl/Cmd+A (after a block's text is already fully selected) escalates
  // to "select every block on the page"; Backspace/Delete then deletes them all.
  useEffect(() => {
    if (!allSelected) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAllSelected(false);
        return;
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        const ids = cards.map((c) => c.id);
        setCards([]);
        ids.forEach((id) => fetch(`/api/blocks/${id}`, { method: "DELETE" }));
        setAllSelected(false);
      }
    }
    function onMouseDown() {
      setAllSelected(false);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [allSelected, cards]);

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
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-1 px-4 py-8 sm:px-10 sm:py-12">
        <div className="mb-6 flex w-full max-w-3xl flex-wrap items-center justify-between gap-3">
          {titleEditable ? (
            <EditableTitle listId={listId} initialName={pageTitle} className="text-3xl font-bold" />
          ) : (
            <h1 className="text-3xl font-bold">{pageTitle}</h1>
          )}
          {inviteBoardId && (
            <div className="flex flex-wrap items-center gap-2">
              <LobbyButton boardId={inviteBoardId} />
              {workspaceMemberships && <WorkspaceMembers memberships={workspaceMemberships} />}
              <InviteButton boardId={inviteBoardId} />
              <BoardSettingsSheet
                boardId={inviteBoardId}
                boardName={pageTitle}
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
            let content: ReactNode;
            if (block.type === "page" && block.ref) {
              content = (
                <PageBlock
                  cardId={card.id}
                  listId={block.ref}
                  href={`${pageHrefBase}/l/${block.ref}`}
                  name={pageNames[block.ref] ?? card.name}
                  onRenamed={handlePageRenamed}
                  onDeleted={handleBlockDeleted}
                />
              );
            } else if (block.type === "table" && block.ref && me) {
              content = (
                <TableBlock
                  cardId={card.id}
                  listId={block.ref}
                  name={pageNames[block.ref] ?? card.name}
                  me={me}
                  onDeleted={handleBlockDeleted}
                />
              );
            } else if (block.type === "bookmark" && block.ref) {
              content = (
                <BookmarkBlock
                  cardId={card.id}
                  url={block.ref}
                  title={card.name}
                  onEdited={handleBookmarkEdited}
                  onDeleted={handleBlockDeleted}
                />
              );
            } else if (block.type === "image") {
              content = (
                <ImageBlock cardId={card.id} attachmentId={block.ref} alt={card.name} onDeleted={handleBlockDeleted} />
              );
            } else {
              content = (
                <TextBlock
                  ref={(handle) => {
                    if (handle) textBlockRefs.current.set(card.id, handle);
                    else textBlockRefs.current.delete(card.id);
                  }}
                  cardId={card.id}
                  initialContent={block.content}
                  onDeleted={handleBlockDeleted}
                  onMergeUp={(text) => handleMergeUp(card.id, text)}
                  onSelectAllEscalate={() => setAllSelected(true)}
                />
              );
            }
            return (
              <div
                key={card.id}
                className={allSelected ? "rounded-md ring-2 ring-primary/70 ring-offset-2 ring-offset-background" : undefined}
              >
                {content}
              </div>
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
