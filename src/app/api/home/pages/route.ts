import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { createBoard, getBoardLists, getMyBoards, TrelloApiError } from "@/lib/trello/client";
import { HOME_LIST_NAME, PERSONAL_BOARD_NAME } from "@/lib/trello/blocks";

export async function GET() {
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const boards = await getMyBoards(token);
    const personalBoard =
      boards.find((b) => b.name === PERSONAL_BOARD_NAME) ?? (await createBoard(PERSONAL_BOARD_NAME, token));
    const lists = await getBoardLists(personalBoard.id, token);
    return NextResponse.json({
      lists: lists.filter((l) => l.name !== HOME_LIST_NAME),
      boardId: personalBoard.id,
    });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
