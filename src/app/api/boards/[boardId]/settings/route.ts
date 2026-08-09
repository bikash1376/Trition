import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { getBoard, updateBoard, TrelloApiError } from "@/lib/trello/client";
import { parseWorkspaceSettings, serializeWorkspaceSettings, type WorkspaceSettings } from "@/lib/trello/board-settings";

export async function GET(_request: Request, { params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const board = await getBoard(boardId, token);
    const { settings } = parseWorkspaceSettings(board.desc);
    return NextResponse.json({
      settings,
      url: board.url,
      prefs: {
        permissionLevel: board.prefs?.permissionLevel ?? "private",
        comments: board.prefs?.comments ?? "members",
        cardCovers: board.prefs?.cardCovers ?? true,
        selfJoin: board.prefs?.selfJoin ?? false,
      },
    });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

interface PatchBody {
  showLastEditedColumn?: boolean;
  permissionLevel?: "private" | "org" | "public";
  comments?: "disabled" | "members" | "org" | "public";
  cardCovers?: boolean;
  selfJoin?: boolean;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as PatchBody | null;
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  try {
    const putParams: Record<string, string> = {};

    if (typeof body.showLastEditedColumn === "boolean") {
      const board = await getBoard(boardId, token);
      const { settings, rest } = parseWorkspaceSettings(board.desc);
      const next: WorkspaceSettings = { ...settings, showLastEditedColumn: body.showLastEditedColumn };
      putParams.desc = serializeWorkspaceSettings(next, rest);
    }
    if (body.permissionLevel) putParams.prefs_permissionLevel = body.permissionLevel;
    if (body.comments) putParams.prefs_comments = body.comments;
    if (typeof body.cardCovers === "boolean") putParams.prefs_cardCovers = String(body.cardCovers);
    if (typeof body.selfJoin === "boolean") putParams.prefs_selfJoin = String(body.selfJoin);

    if (Object.keys(putParams).length === 0) return NextResponse.json({ error: "nothing to update" }, { status: 400 });

    const updated = await updateBoard(boardId, putParams, token);
    const { settings } = parseWorkspaceSettings(updated.desc);
    return NextResponse.json({
      settings,
      prefs: {
        permissionLevel: updated.prefs?.permissionLevel ?? "private",
        comments: updated.prefs?.comments ?? "members",
        cardCovers: updated.prefs?.cardCovers ?? true,
        selfJoin: updated.prefs?.selfJoin ?? false,
      },
    });
  } catch (err) {
    if (err instanceof TrelloApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
