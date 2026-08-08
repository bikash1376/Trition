import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { addCardMember, removeCardMember, TrelloApiError } from "@/lib/trello/client";

export async function POST(request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (typeof body?.memberId !== "string") {
    return NextResponse.json({ error: "memberId is required" }, { status: 400 });
  }

  try {
    if (body.add) {
      await addCardMember(cardId, body.memberId, token);
    } else {
      await removeCardMember(cardId, body.memberId, token);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
