import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { getListCards, TrelloApiError, updateCardDesc } from "@/lib/trello/client";
import { COLUMNS_SCHEMA_CARD_NAME, parseColumnSchema, serializeColumnSchema, type SelectOption } from "@/lib/trello/columns";

async function findSchemaCard(listId: string, token: string) {
  const cards = await getListCards(listId, token);
  return cards.find((c) => c.name === COLUMNS_SCHEMA_CARD_NAME) ?? null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ listId: string; columnId: string }> },
) {
  const { listId, columnId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);

  try {
    const schemaCard = await findSchemaCard(listId, token);
    if (!schemaCard) return NextResponse.json({ error: "no columns for this list" }, { status: 404 });

    const columns = parseColumnSchema(schemaCard.desc);
    const next = columns.map((c) => {
      if (c.id !== columnId) return c;
      return {
        ...c,
        ...(typeof body?.name === "string" && body.name.trim() ? { name: body.name.trim() } : {}),
        ...(Array.isArray(body?.options) ? { options: body.options as SelectOption[] } : {}),
      };
    });
    await updateCardDesc(schemaCard.id, serializeColumnSchema(next), token);
    return NextResponse.json({ columns: next });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ listId: string; columnId: string }> },
) {
  const { listId, columnId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const schemaCard = await findSchemaCard(listId, token);
    if (!schemaCard) return NextResponse.json({ ok: true, columns: [] });

    const columns = parseColumnSchema(schemaCard.desc).filter((c) => c.id !== columnId);
    await updateCardDesc(schemaCard.id, serializeColumnSchema(columns), token);
    return NextResponse.json({ ok: true, columns });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
