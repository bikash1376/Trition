import { NextResponse } from "next/server";
import { demoTrelloToken } from "@/lib/trello/env";
import { deleteBoard, getMyBoards, TrelloApiError } from "@/lib/trello/client";
import { invalidate } from "@/lib/trello/cache";
import { TRELLO_TOKEN_COOKIE } from "@/lib/trello/session";

// If nothing on the shared demo account has been touched in this long, wipe it back to
// zero boards before letting the next visitor in — the app's normal first-visit logic
// (see /home) recreates a fresh, empty personal board automatically from there.
const RESET_AFTER_MS = 60 * 60_000;

export async function POST(request: Request) {
  const token = demoTrelloToken();
  if (!token) {
    return NextResponse.json({ error: "Demo mode isn't configured on this deployment." }, { status: 503 });
  }

  try {
    const boards = await getMyBoards(token);
    if (boards.length > 0) {
      const mostRecentActivity = Math.max(
        ...boards.map((b) => (b.dateLastActivity ? new Date(b.dateLastActivity).getTime() : 0)),
      );
      if (Date.now() - mostRecentActivity > RESET_AFTER_MS) {
        await Promise.all(boards.map((b) => deleteBoard(b.id, token)));
        invalidate(`my-boards:${token}`);
      }
    }
  } catch (err) {
    // Best-effort sweep — if it fails, still let the visitor in rather than blocking the demo.
    if (!(err instanceof TrelloApiError)) throw err;
  }

  // 303: browsers convert the redirected navigation to GET instead of replaying this POST.
  const response = NextResponse.redirect(new URL("/home", request.url), 303);
  response.cookies.set(TRELLO_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
