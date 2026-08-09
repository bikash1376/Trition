import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import {
  archiveCard,
  getCard,
  getCardAttachments,
  getCardComments,
  getCardCreator,
  getCardLastEditor,
  getCardMembers,
  TrelloApiError,
  updateCardDesc,
  updateCardName,
} from "@/lib/trello/client";
import { parseCardProps, serializeCardProps } from "@/lib/trello/columns";

export async function GET(_request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const card = await getCard(cardId, token);
    const [members, creator, lastEditor, comments, attachments] = await Promise.all([
      getCardMembers(cardId, token),
      getCardCreator(cardId, token),
      getCardLastEditor(cardId, token),
      getCardComments(cardId, token),
      getCardAttachments(cardId, token),
    ]);
    const { props, rest } = parseCardProps(card.desc);
    return NextResponse.json({ card: { ...card, desc: rest }, props, members, creator, lastEditor, comments, attachments });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (typeof body?.name !== "string" && typeof body?.desc !== "string") {
    return NextResponse.json({ error: "name or desc is required" }, { status: 400 });
  }

  try {
    let card;
    if (typeof body?.name === "string" && body.name.trim().length > 0) {
      card = await updateCardName(cardId, body.name.trim(), token);
    }
    if (typeof body?.desc === "string") {
      const current = await getCard(cardId, token);
      const { props } = parseCardProps(current.desc);
      card = await updateCardDesc(cardId, serializeCardProps(props, body.desc), token);
      card = { ...card, desc: body.desc };
    }
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
