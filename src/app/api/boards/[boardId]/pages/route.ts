import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { createList, getBoardLists, TrelloApiError } from "@/lib/trello/client";
import { HOME_LIST_NAME } from "@/lib/trello/blocks";

export async function GET(_request: Request, { params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const lists = await getBoardLists(boardId, token);
    return NextResponse.json({ lists: lists.filter((l) => l.name !== HOME_LIST_NAME), boardId });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" && body.name.trim().length > 0 ? body.name.trim() : "Untitled";

  try {
    const list = await createList(boardId, name, token);
    return NextResponse.json({ list });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
