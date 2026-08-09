import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { createCard, getListCards, TrelloApiError, updateCardDesc } from "@/lib/trello/client";
import {
  COLUMNS_SCHEMA_CARD_NAME,
  newColumnId,
  parseColumnSchema,
  serializeColumnSchema,
  type ColumnDef,
  type ColumnType,
} from "@/lib/trello/columns";

const VALID_TYPES: ColumnType[] = ["text", "number", "date", "checkbox", "select"];

async function findSchemaCard(listId: string, token: string) {
  const cards = await getListCards(listId, token);
  return cards.find((c) => c.name === COLUMNS_SCHEMA_CARD_NAME) ?? null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const schemaCard = await findSchemaCard(listId, token);
    const columns = schemaCard ? parseColumnSchema(schemaCard.desc) : [];
    return NextResponse.json({ columns });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (typeof body?.name !== "string" || !VALID_TYPES.includes(body?.type)) {
    return NextResponse.json({ error: "name and a valid type are required" }, { status: 400 });
  }

  try {
    const schemaCard = await findSchemaCard(listId, token);
    const columns = schemaCard ? parseColumnSchema(schemaCard.desc) : [];
    const column: ColumnDef = {
      id: newColumnId(),
      name: body.name.trim() || "Untitled",
      type: body.type,
      ...(body.type === "select" ? { options: [] } : {}),
    };
    const next = [...columns, column];

    if (!schemaCard) {
      await createCard(listId, COLUMNS_SCHEMA_CARD_NAME, token, serializeColumnSchema(next));
    } else {
      await updateCardDesc(schemaCard.id, serializeColumnSchema(next), token);
    }
    return NextResponse.json({ column, columns: next });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
