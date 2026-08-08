import { NextResponse } from "next/server";
import { TRELLO_TOKEN_COOKIE } from "@/lib/trello/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = body?.token;

  if (typeof token !== "string" || token.length === 0) {
    return NextResponse.json({ error: "missing token" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(TRELLO_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
