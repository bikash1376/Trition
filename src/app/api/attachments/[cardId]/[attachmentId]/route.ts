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

  // Trello's query-param key/token auth (?key=&token=) is rejected on the
  // attachment download route — auth has to go via the OAuth header instead.
  const authHeader = {
    Authorization: `OAuth oauth_consumer_key="${trelloApiKey()}", oauth_token="${token}"`,
  };
  const downloadUrl = `https://api.trello.com/1/cards/${cardId}/attachments/${attachmentId}/download/${encodeURIComponent(attachment.name || "file")}`;

  let upstream = await fetch(downloadUrl, { headers: authHeader });

  // Link-style attachments (not file uploads) don't live at the /download
  // route — fall back to the attachment's own url, authed then bare.
  if (!upstream.ok) {
    upstream = await fetch(attachment.url, { headers: authHeader });
  }
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
