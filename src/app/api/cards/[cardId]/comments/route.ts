import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { addComment, TrelloApiError } from "@/lib/trello/client";

export async function POST(request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (typeof body?.text !== "string" || body.text.trim().length === 0) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const comment = await addComment(cardId, body.text.trim(), token);
    return NextResponse.json({ comment });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
