import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { createCard, TrelloApiError, updateCardDesc, uploadCardAttachment } from "@/lib/trello/client";
import { serializeBlock } from "@/lib/trello/blocks";

export async function POST(request: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  try {
    const card = await createCard(listId, file.name || "Image", token, serializeBlock("image", null, ""));
    const attachment = await uploadCardAttachment(card.id, file, token);
    const updated = await updateCardDesc(card.id, serializeBlock("image", attachment.id, ""), token);
    return NextResponse.json({ card: { ...updated, attachments: [attachment] } });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
