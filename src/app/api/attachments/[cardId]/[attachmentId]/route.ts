import { getTrelloToken } from "@/lib/trello/session";
import { getCardAttachments } from "@/lib/trello/client";
import { trelloApiKey } from "@/lib/trello/env";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cardId: string; attachmentId: string }> },
) {
  const { cardId, attachmentId } = await params;
  const token = await getTrelloToken();
  if (!token) return new Response("unauthorized", { status: 401 });

  const attachments = await getCardAttachments(cardId, token);
  const attachment = attachments.find((a) => a.id === attachmentId);
  if (!attachment) return new Response("not found", { status: 404 });

  const separator = attachment.url.includes("?") ? "&" : "?";
  const authedUrl = `${attachment.url}${separator}key=${trelloApiKey()}&token=${token}`;

  let upstream = await fetch(authedUrl);

  // Some Trello attachment URLs are already pre-signed (e.g. S3) — appending
  // key/token can break the signature. If the authed attempt fails, retry
  // the bare url in case it was already publicly accessible as-is.
  if (!upstream.ok) {
    upstream = await fetch(attachment.url);
  }

  if (!upstream.ok || !upstream.body) {
    return new Response("upstream error", { status: upstream.status || 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? attachment.mimeType ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
