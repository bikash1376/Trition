import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { archiveCard, getCard, updateCardDesc, updateCardName, TrelloApiError } from "@/lib/trello/client";
import { parseBlock, serializeBlock, type BlockType } from "@/lib/trello/blocks";

export async function PATCH(request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  try {
    // Plain text-block content edit (existing behavior)
    if (typeof body.content === "string" && body.type === undefined && body.ref === undefined) {
      const desc = serializeBlock("text", null, body.content);
      const name = body.content.split("\n")[0]?.slice(0, 80) || "Untitled";
      const [card] = await Promise.all([updateCardDesc(cardId, desc, token), updateCardName(cardId, name, token)]);
      return NextResponse.json({ card });
    }

    // Generic block edit (e.g. bookmark URL) — read-modify-write so untouched fields survive
    const current = await getCard(cardId, token);
    const parsed = parseBlock(current.desc);
    const type: BlockType = (body.type as BlockType) ?? parsed.type;
    const ref = body.ref !== undefined ? body.ref : parsed.ref;
    const content = body.content !== undefined ? body.content : parsed.content;
    const desc = serializeBlock(type, ref, content);

    const updates: Promise<unknown>[] = [updateCardDesc(cardId, desc, token)];
    if (typeof body.name === "string" && body.name.trim()) {
      updates.push(updateCardName(cardId, body.name.trim(), token));
    }
    await Promise.all(updates);
    const card = await getCard(cardId, token);
    return NextResponse.json({ card });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    await archiveCard(cardId, token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
