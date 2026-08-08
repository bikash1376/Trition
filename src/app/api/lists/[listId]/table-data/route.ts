import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { getBoardLabels, getBoardMembers, getCardCreator, getList, getListCards, TrelloApiError } from "@/lib/trello/client";

export async function GET(_request: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const [cards, list] = await Promise.all([getListCards(listId, token), getList(listId, token)]);
    const boardId = list.idBoard;

    const [members, labels, creators] = await Promise.all([
      getBoardMembers(boardId, token),
      getBoardLabels(boardId, token),
      Promise.all(cards.map((card) => getCardCreator(card.id, token))),
    ]);

    const rows = cards.map((card, i) => ({ card, creator: creators[i] }));
    return NextResponse.json({ rows, members, labels });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
