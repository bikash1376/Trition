import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { createBoard, getBoard, getBoardLists, getMyBoards, TrelloApiError } from "@/lib/trello/client";
import { HOME_LIST_NAME, PERSONAL_BOARD_NAME } from "@/lib/trello/blocks";
import { parseWorkspaceSettings } from "@/lib/trello/board-settings";

export async function GET() {
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const boards = await getMyBoards(token);
    const personalBoard =
      boards.find((b) => b.name === PERSONAL_BOARD_NAME) ?? (await createBoard(PERSONAL_BOARD_NAME, token));
    const [lists, board] = await Promise.all([
      getBoardLists(personalBoard.id, token),
      getBoard(personalBoard.id, token),
    ]);
    const { settings } = parseWorkspaceSettings(board.desc);
    const canvasListIds = settings.canvasListIds ?? [];
    return NextResponse.json({
      lists: lists
        .filter((l) => l.name !== HOME_LIST_NAME && !settings.tableListIds.includes(l.id))
        .map((list) => ({ ...list, isCanvas: canvasListIds.includes(list.id) })),
      boardId: personalBoard.id,
      canvasListIds,
    });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
