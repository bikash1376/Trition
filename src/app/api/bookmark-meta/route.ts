import { NextResponse } from "next/server";
import { getTrelloToken } from "@/lib/trello/session";
import { cached } from "@/lib/trello/cache";
import { fetchLinkMetadata } from "@/lib/link-metadata";

const META_TTL = 30 * 60_000;

export async function GET(request: Request) {
  const token = await getTrelloToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: "a valid url is required" }, { status: 400 });
  }

  const meta = await cached(`bookmark-meta:${url}`, META_TTL, () => fetchLinkMetadata(url));
  return NextResponse.json(meta);
}
