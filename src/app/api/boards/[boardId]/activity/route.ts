import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { getBoardActions, TrelloApiError } from "@/lib/trello/client";
import { COVER_CARD_NAME } from "@/lib/trello/blocks";
import { COLUMNS_SCHEMA_CARD_NAME } from "@/lib/trello/columns";

const HIDDEN_CARD_NAMES = new Set([COVER_CARD_NAME, COLUMNS_SCHEMA_CARD_NAME, "__daspace_settings__"]);

const VERB_BY_TYPE: Record<string, string> = {
  createCard: "created",
  copyCard: "created",
  updateCard: "edited",
  deleteCard: "deleted",
  commentCard: "commented on",
  createList: "created",
  updateList: "renamed",
};

export async function GET(_request: Request, { params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const actions = await getBoardActions(boardId, token);
    const entries = actions
      .filter((a) => {
        const cardName = a.data.card?.name;
        return !cardName || !HIDDEN_CARD_NAMES.has(cardName);
      })
      .map((a) => ({
        id: a.id,
        member: a.memberCreator,
        verb: VERB_BY_TYPE[a.type] ?? "updated",
        pageName: a.data.list?.name ?? a.data.card?.name ?? a.data.board?.name ?? "this workspace",
        date: a.date,
      }))
      .slice(0, 10);

    return NextResponse.json({ entries });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
