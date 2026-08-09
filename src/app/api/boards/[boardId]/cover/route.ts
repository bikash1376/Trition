import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import {
  archiveCard,
  createCard,
  deleteCardAttachment,
  getCardAttachments,
  getListCards,
  TrelloApiError,
  updateCardDesc,
  uploadCardAttachment,
} from "@/lib/trello/client";
import { COVER_CARD_NAME } from "@/lib/trello/blocks";

const DEFAULT_HEIGHT_PERCENT = 40;

async function findCoverCard(listId: string, token: string) {
  const cards = await getListCards(listId, token);
  return cards.find((c) => c.name === COVER_CARD_NAME) ?? null;
}

export async function POST(request: Request) {
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const homeListId = form.get("homeListId");
  const heightPercent = Number(form.get("heightPercent")) || DEFAULT_HEIGHT_PERCENT;
  if (!(file instanceof File) || typeof homeListId !== "string") {
    return NextResponse.json({ error: "file and homeListId are required" }, { status: 400 });
  }

  try {
    let coverCard = await findCoverCard(homeListId, token);
    if (!coverCard) {
      coverCard = await createCard(homeListId, COVER_CARD_NAME, token);
    } else {
      const existing = await getCardAttachments(coverCard.id, token);
      await Promise.all(existing.map((a) => deleteCardAttachment(coverCard!.id, a.id, token)));
    }
    const attachment = await uploadCardAttachment(coverCard.id, file, token);
    const updated = await updateCardDesc(coverCard.id, `${attachment.id}|${heightPercent}`, token);
    return NextResponse.json({ card: updated, attachmentId: attachment.id, heightPercent });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function PATCH(request: Request) {
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (typeof body?.homeListId !== "string" || typeof body?.heightPercent !== "number") {
    return NextResponse.json({ error: "homeListId and heightPercent are required" }, { status: 400 });
  }

  try {
    const coverCard = await findCoverCard(body.homeListId, token);
    if (!coverCard) return NextResponse.json({ error: "no cover set" }, { status: 404 });
    const [attachmentId] = coverCard.desc.split("|");
    const updated = await updateCardDesc(coverCard.id, `${attachmentId}|${body.heightPercent}`, token);
    return NextResponse.json({ card: updated });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(request: Request) {
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (typeof body?.homeListId !== "string") {
    return NextResponse.json({ error: "homeListId is required" }, { status: 400 });
  }

  try {
    const coverCard = await findCoverCard(body.homeListId, token);
    if (coverCard) await archiveCard(coverCard.id, token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
