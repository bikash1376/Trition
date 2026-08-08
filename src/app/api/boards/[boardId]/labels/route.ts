import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { getBoardLabels, TrelloApiError } from "@/lib/trello/client";

export async function GET(_request: Request, { params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const labels = await getBoardLabels(boardId, token);
    return NextResponse.json({ labels });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
