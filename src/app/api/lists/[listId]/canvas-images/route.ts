import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { getListCardsWithAttachments, TrelloApiError } from "@/lib/trello/client";
import { parseBlock } from "@/lib/trello/blocks";

export async function GET(_request: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const cards = await getListCardsWithAttachments(listId, token);
    const images = cards
      .map((card) => {
        const block = parseBlock(card.desc);
        if (block.type !== "image" || !block.ref) return null;
        const attachment = card.attachments?.find((a) => a.id === block.ref);
        if (!attachment) return null;
        let meta = { x: 100, y: 100, scale: 1 };
        try {
          const parsed = JSON.parse(block.content || "{}");
          if (parsed && typeof parsed.meta === "object") {
            meta = { ...meta, ...parsed.meta };
          }
        } catch {
          // ignore
        }
        return {
          id: card.id,
          src: `/api/attachments/${card.id}/${attachment.id}`,
          x: meta.x,
          y: meta.y,
          scale: meta.scale,
          cardId: card.id,
          attachmentId: attachment.id,
        };
      })
      .filter(Boolean);
    return NextResponse.json({ images });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
