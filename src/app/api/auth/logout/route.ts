import { NextResponse } from "next/server";
import { TRELLO_TOKEN_COOKIE } from "@/lib/trello/session";
import { appUrl } from "@/lib/trello/env";

export async function POST() {
  const response = NextResponse.redirect(`${appUrl()}/login`, { status: 303 });
  response.cookies.delete(TRELLO_TOKEN_COOKIE);
  return response;
}
