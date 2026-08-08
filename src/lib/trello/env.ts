export function trelloApiKey() {
  const key = process.env.TRELLO_API_KEY;
  if (!key) throw new Error("TRELLO_API_KEY is not set (see .env.local.example)");
  return key;
}

export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
