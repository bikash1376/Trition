import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import {
  archiveCard,
  getCard,
  getCardAttachments,
  getCardComments,
  getCardCreator,
  getCardMembers,
  TrelloApiError,
  updateCardName,
} from "@/lib/trello/client";

export async function GET(_request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const card = await getCard(cardId, token);
    const [members, creator, comments, attachments] = await Promise.all([
      getCardMembers(cardId, token),
      getCardCreator(cardId, token),
      getCardComments(cardId, token),
      getCardAttachments(cardId, token),
    ]);
    return NextResponse.json({ card, members, creator, comments, attachments });
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
  if (typeof body?.name !== "string" || body.name.trim().length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  try {
    const card = await updateCardName(cardId, body.name.trim(), token);
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
