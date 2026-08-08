import { cookies } from "next/headers";

export const TRELLO_TOKEN_COOKIE = "daspace_trello_token";

export async function getTrelloToken() {
  const store = await cookies();
  return store.get(TRELLO_TOKEN_COOKIE)?.value ?? null;
}
