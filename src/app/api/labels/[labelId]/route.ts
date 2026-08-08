import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { deleteLabel, TrelloApiError, updateLabel } from "@/lib/trello/client";

export async function PATCH(request: Request, { params }: { params: Promise<{ labelId: string }> }) {
  const { labelId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const color = typeof body?.color === "string" ? body.color : null;

  try {
    const label = await updateLabel(labelId, name, color, token);
    return NextResponse.json({ label });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ labelId: string }> }) {
  const { labelId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    await deleteLabel(labelId, token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
