"use client";

import { useState } from "react";
import { parseBlock } from "@/lib/trello/blocks";
import type { TrelloCard, TrelloList, TrelloMember } from "@/lib/trello/types";
import { BlockComposer } from "@/components/blocks/block-composer";
import { BookmarkBlock } from "@/components/blocks/bookmark-block";
import { ImageBlock } from "@/components/blocks/image-block";
import { PageBlock } from "@/components/blocks/page-block";
import { TableBlock } from "@/components/blocks/table-block";
import { TextBlock } from "@/components/blocks/text-block";
import { EditableTitle } from "@/components/shell/editable-title";
import { InviteButton } from "@/components/shell/invite-button";

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
}: BlockCanvasProps) {
  const [cards, setCards] = useState(initialCards);
  const [pageNames, setPageNames] = useState(initialPageNames);

  function handleCreated(card: TrelloCard, list?: TrelloList) {
    setCards((prev) => [...prev, card]);
    if (list) setPageNames((prev) => ({ ...prev, [list.id]: list.name }));
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-1 overflow-y-auto px-10 py-12">
      <div className="mb-6 flex items-center justify-between">
        {titleEditable ? (
          <EditableTitle listId={listId} initialName={pageTitle} className="text-3xl font-bold" />
        ) : (
          <h1 className="text-3xl font-bold">{pageTitle}</h1>
        )}
        {inviteBoardId && <InviteButton boardId={inviteBoardId} />}
      </div>

      {cards.map((card) => {
        const block = parseBlock(card.desc);
        if (block.type === "page" && block.ref) {
          return (
            <PageBlock
              key={card.id}
              href={`${pageHrefBase}/l/${block.ref}`}
              name={pageNames[block.ref] ?? card.name}
            />
          );
        }
        if (block.type === "table" && block.ref && me) {
          return <TableBlock key={card.id} listId={block.ref} name={pageNames[block.ref] ?? card.name} me={me} />;
        }
        if (block.type === "bookmark" && block.ref) {
          return <BookmarkBlock key={card.id} url={block.ref} title={card.name} />;
        }
        if (block.type === "image") {
          return <ImageBlock key={card.id} cardId={card.id} attachmentId={block.ref} alt={card.name} />;
        }
        return <TextBlock key={card.id} cardId={card.id} initialContent={block.content} />;
      })}

      <BlockComposer
        boardId={boardId}
        listId={listId}
        pages={Object.entries(pageNames).map(([id, name]) => ({ id, name }))}
        onCreated={handleCreated}
      />
    </div>
  );
}
