import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { getCard, TrelloApiError, updateCardDesc } from "@/lib/trello/client";
import { parseCardProps, serializeCardProps } from "@/lib/trello/columns";

export async function PATCH(request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (typeof body?.columnId !== "string") {
    return NextResponse.json({ error: "columnId is required" }, { status: 400 });
  }

  try {
    const card = await getCard(cardId, token);
    const { props, rest } = parseCardProps(card.desc);
    if (body.value === null || body.value === undefined || body.value === "") {
      delete props[body.columnId];
    } else {
      props[body.columnId] = body.value;
    }
    await updateCardDesc(cardId, serializeCardProps(props, rest), token);
    return NextResponse.json({ props });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
