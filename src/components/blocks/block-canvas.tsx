"use client";

import { useState } from "react";
import { parseBlock } from "@/lib/trello/blocks";
import type { TrelloCard, TrelloList } from "@/lib/trello/types";
import { BlockComposer } from "@/components/blocks/block-composer";
import { BookmarkBlock } from "@/components/blocks/bookmark-block";
import { ImageBlock } from "@/components/blocks/image-block";
import { PageBlock } from "@/components/blocks/page-block";
import { TextBlock } from "@/components/blocks/text-block";

interface BlockCanvasProps {
  boardId: string;
  listId: string;
  pageTitle: string;
  cards: TrelloCard[];
  pageNames: Record<string, string>;
}

export function BlockCanvas({ boardId, listId, pageTitle, cards: initialCards, pageNames: initialPageNames }: BlockCanvasProps) {
  const [cards, setCards] = useState(initialCards);
  const [pageNames, setPageNames] = useState(initialPageNames);

  function handleCreated(card: TrelloCard, list?: TrelloList) {
    setCards((prev) => [...prev, card]);
    if (list) setPageNames((prev) => ({ ...prev, [list.id]: list.name }));
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-1 overflow-y-auto px-10 py-12">
      <h1 className="mb-6 text-3xl font-bold">{pageTitle}</h1>

      {cards.map((card) => {
        const block = parseBlock(card.desc);
        if (block.type === "page" && block.ref) {
          return (
            <PageBlock key={card.id} boardId={boardId} listId={block.ref} name={pageNames[block.ref] ?? card.name} />
          );
        }
        if (block.type === "bookmark" && block.ref) {
          return <BookmarkBlock key={card.id} url={block.ref} title={card.name} />;
        }
        if (block.type === "image") {
          return <ImageBlock key={card.id} cardId={card.id} attachmentId={block.ref} alt={card.name} />;
        }
        return <TextBlock key={card.id} cardId={card.id} initialContent={block.content} />;
      })}

      <BlockComposer boardId={boardId} listId={listId} onCreated={handleCreated} />
    </div>
  );
}
