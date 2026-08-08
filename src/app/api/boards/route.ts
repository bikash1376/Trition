import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { createBoard, TrelloApiError } from "@/lib/trello/client";

export async function POST(request: Request) {
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" && body.name.trim().length > 0 ? body.name.trim() : "Untitled";
  const permissionLevel = body?.permissionLevel === "public" ? "public" : "private";

  try {
    const board = await createBoard(name, token, permissionLevel);
    return NextResponse.json({ board });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
