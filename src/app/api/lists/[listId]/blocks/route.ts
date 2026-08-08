import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { createCard, createList, TrelloApiError } from "@/lib/trello/client";
import { serializeBlock } from "@/lib/trello/blocks";

export async function POST(request: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const type = body?.type === "page" || body?.type === "bookmark" ? body.type : "text";

  try {
    if (type === "page") {
      const boardId = body?.boardId;
      const name = typeof body?.name === "string" && body.name.trim().length > 0 ? body.name.trim() : "Untitled";
      if (typeof boardId !== "string") {
        return NextResponse.json({ error: "boardId is required for page blocks" }, { status: 400 });
      }
      const list = await createList(boardId, name, token);
      const desc = serializeBlock("page", list.id, "");
      const card = await createCard(listId, name, token, desc);
      return NextResponse.json({ card, list });
    }

    if (type === "bookmark") {
      const raw = typeof body?.url === "string" ? body.url.trim() : "";
      if (!raw) return NextResponse.json({ error: "url is required for bookmark blocks" }, { status: 400 });
      const url = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
      let hostname = url;
      try {
        hostname = new URL(url).hostname;
      } catch {
        // keep raw url as the display name if it doesn't parse
      }
      const desc = serializeBlock("bookmark", url, "");
      const card = await createCard(listId, hostname, token, desc);
      return NextResponse.json({ card });
    }

    const content = typeof body?.content === "string" ? body.content : "";
    const desc = serializeBlock("text", null, content);
    const name = content.split("\n")[0]?.slice(0, 80) || "Untitled";
    const card = await createCard(listId, name, token, desc);
    return NextResponse.json({ card });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
