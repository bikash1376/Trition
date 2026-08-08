import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { createCard, TrelloApiError } from "@/lib/trello/client";

export async function POST(request: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (typeof body?.name !== "string" || body.name.trim().length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  try {
    const card = await createCard(listId, body.name.trim(), token);
    return NextResponse.json({ card });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
