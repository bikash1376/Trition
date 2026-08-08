import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { updateCardDesc, updateCardName, TrelloApiError } from "@/lib/trello/client";
import { serializeBlock } from "@/lib/trello/blocks";

export async function PATCH(request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (typeof body?.content !== "string") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  try {
    const desc = serializeBlock("text", null, body.content);
    const name = body.content.split("\n")[0]?.slice(0, 80) || "Untitled";
    const [card] = await Promise.all([
      updateCardDesc(cardId, desc, token),
      updateCardName(cardId, name, token),
    ]);
    return NextResponse.json({ card });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
