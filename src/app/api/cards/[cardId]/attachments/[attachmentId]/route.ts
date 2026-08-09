import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { deleteCardAttachment, TrelloApiError } from "@/lib/trello/client";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ cardId: string; attachmentId: string }> },
) {
  const { cardId, attachmentId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    await deleteCardAttachment(cardId, attachmentId, token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
