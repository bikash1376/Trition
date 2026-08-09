import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { getBoardLabels, getBoardMembers, getCardCreator, getList, getListCards, TrelloApiError } from "@/lib/trello/client";
import { COLUMNS_SCHEMA_CARD_NAME, parseCardProps, parseColumnSchema } from "@/lib/trello/columns";

export async function GET(_request: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const [allCards, list] = await Promise.all([getListCards(listId, token), getList(listId, token)]);
    const boardId = list.idBoard;
    const schemaCard = allCards.find((c) => c.name === COLUMNS_SCHEMA_CARD_NAME);
    const cards = allCards.filter((c) => c.name !== COLUMNS_SCHEMA_CARD_NAME);
    const columns = schemaCard ? parseColumnSchema(schemaCard.desc) : [];

    const [members, labels, creators] = await Promise.all([
      getBoardMembers(boardId, token),
      getBoardLabels(boardId, token),
      Promise.all(cards.map((card) => getCardCreator(card.id, token))),
    ]);

    const rows = cards.map((card, i) => {
      const { props, rest } = parseCardProps(card.desc);
      return { card: { ...card, desc: rest }, creator: creators[i], props };
    });
    return NextResponse.json({ rows, members, labels, columns });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
