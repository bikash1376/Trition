import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { createList, getBoard, getBoardLists, updateBoard, TrelloApiError } from "@/lib/trello/client";
import { HOME_LIST_NAME } from "@/lib/trello/blocks";
import { invalidate } from "@/lib/trello/cache";
import { parseWorkspaceSettings, serializeWorkspaceSettings } from "@/lib/trello/board-settings";

export async function GET(_request: Request, { params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const [lists, board] = await Promise.all([getBoardLists(boardId, token), getBoard(boardId, token)]);
    const { settings } = parseWorkspaceSettings(board.desc);
    const canvasListIds = settings.canvasListIds ?? [];
    const pages = lists
      .filter((l) => l.name !== HOME_LIST_NAME && !settings.tableListIds.includes(l.id))
      .map((list) => ({ ...list, isCanvas: canvasListIds.includes(list.id) }));
    return NextResponse.json({ lists: pages, boardId });
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
    const type = body?.type === "canvas" ? "canvas" : "page";
    const list = await createList(boardId, name, token);
    if (type === "canvas") {
      const board = await getBoard(boardId, token);
      const { settings, rest } = parseWorkspaceSettings(board.desc);
      const next = { ...settings, canvasListIds: [...settings.canvasListIds, list.id] };
      await updateBoard(boardId, { desc: serializeWorkspaceSettings(next, rest) }, token);
      invalidate(`board:${boardId}`);
    }
    return NextResponse.json({ list });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
