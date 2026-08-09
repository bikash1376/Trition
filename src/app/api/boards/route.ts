import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { createBoard, getMyBoards, TrelloApiError } from "@/lib/trello/client";
import { invalidate } from "@/lib/trello/cache";
import { PERSONAL_BOARD_NAME } from "@/lib/trello/blocks";

export async function GET() {
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const allBoards = await getMyBoards(token);
    const boards = allBoards.filter((b) => b.name !== PERSONAL_BOARD_NAME);
    return NextResponse.json({ boards });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function POST(request: Request) {
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" && body.name.trim().length > 0 ? body.name.trim() : "Untitled";
  const permissionLevel = body?.permissionLevel === "public" ? "public" : "private";

  try {
    const board = await createBoard(name, token, permissionLevel);
    invalidate(`my-boards:${token}`);
    return NextResponse.json({ board });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
