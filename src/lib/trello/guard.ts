import { redirect } from "next/navigation";
import { getTrelloToken } from "./session";
import { TrelloApiError } from "./client";

export async function requireToken() {
  const token = await getTrelloToken();
  if (!token) redirect("/login");
  return token;
}

export function withAuthGuard<T>(promise: Promise<T>) {
  return promise.catch((err) => {
    if (err instanceof TrelloApiError && err.status === 401) redirect("/api/auth/trello/expire");
    throw err;
  });
}
