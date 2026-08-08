import { NextResponse } from "next/server";
import { appUrl, trelloApiKey } from "@/lib/trello/env";

export async function GET() {
  let key: string;
  try {
    key = trelloApiKey();
  } catch {
    return NextResponse.redirect(`${appUrl()}/login?error=missing_trello_key`);
  }

  const params = new URLSearchParams({
    expiration: "never",
    scope: "read,write,account",
    response_type: "token",
    key,
    name: "DaSpace",
    return_url: `${appUrl()}/auth/trello/callback`,
  });

  return NextResponse.redirect(`https://trello.com/1/authorize?${params.toString()}`);
}
