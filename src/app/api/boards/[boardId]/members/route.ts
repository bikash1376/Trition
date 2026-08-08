import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { inviteBoardMember, TrelloApiError } from "@/lib/trello/client";

export async function POST(request: Request, { params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (typeof body?.email !== "string" || !body.email.includes("@")) {
    return NextResponse.json({ error: "a valid email is required" }, { status: 400 });
  }

  try {
    await inviteBoardMember(boardId, body.email.trim(), token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
