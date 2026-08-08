import { trelloApiKey } from "./env";
import type { TrelloBoard, TrelloCard, TrelloCommentAction, TrelloList, TrelloMember } from "./types";

const BASE_URL = "https://api.trello.com/1";

export class TrelloApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function trelloFetch<T>(
  path: string,
  token: string,
  params: Record<string, string> = {},
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
): Promise<T> {
  const url = new URL(BASE_URL + path);
  url.searchParams.set("key", trelloApiKey());
  url.searchParams.set("token", token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), { method, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new TrelloApiError(res.status, text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export function getMe(token: string) {
  return trelloFetch<TrelloMember>("/members/me", token, {
    fields: "fullName,username,avatarUrl",
  });
}

export function getMyBoards(token: string) {
  return trelloFetch<TrelloBoard[]>("/members/me/boards", token, {
    fields: "name,url,closed",
    filter: "open",
  });
}

export function getBoard(boardId: string, token: string) {
  return trelloFetch<TrelloBoard>(`/boards/${boardId}`, token, {
    fields: "name,url,closed",
  });
}

export function getBoardLists(boardId: string, token: string) {
  return trelloFetch<TrelloList[]>(`/boards/${boardId}/lists`, token, {
    fields: "name,closed,idBoard",
    filter: "open",
  });
}

export function getBoardMembers(boardId: string, token: string) {
  return trelloFetch<TrelloMember[]>(`/boards/${boardId}/members`, token, {
    fields: "fullName,username,avatarUrl",
  });
}

export function getListCards(listId: string, token: string) {
  return trelloFetch<TrelloCard[]>(`/lists/${listId}/cards`, token, {
    fields: "name,desc,idList,idMembers,labels,due,closed,shortUrl",
  });
}

export function getCard(cardId: string, token: string) {
  return trelloFetch<TrelloCard>(`/cards/${cardId}`, token, {
    fields: "name,desc,idList,idMembers,labels,due,closed,shortUrl",
  });
}

export function getCardMembers(cardId: string, token: string) {
  return trelloFetch<TrelloMember[]>(`/cards/${cardId}/members`, token, {
    fields: "fullName,username,avatarUrl",
  });
}

export function getCardComments(cardId: string, token: string) {
  return trelloFetch<TrelloCommentAction[]>(`/cards/${cardId}/actions`, token, {
    filter: "commentCard",
    fields: "date,data",
    member_fields: "fullName,username,avatarUrl",
    memberCreator_fields: "fullName,username,avatarUrl",
  });
}

export function addComment(cardId: string, text: string, token: string) {
  return trelloFetch<TrelloCommentAction>(
    `/cards/${cardId}/actions/comments`,
    token,
    { text },
    "POST",
  );
}

interface CreatorAction {
  idMemberCreator: string;
  memberCreator: TrelloMember;
}

export async function getCardCreator(cardId: string, token: string): Promise<TrelloMember | null> {
  const actions = await trelloFetch<CreatorAction[]>(`/cards/${cardId}/actions`, token, {
    filter: "createCard,copyCard",
    limit: "1",
    memberCreator_fields: "fullName,username,avatarUrl",
  });
  return actions[0]?.memberCreator ?? null;
}

export function updateCardName(cardId: string, name: string, token: string) {
  return trelloFetch<TrelloCard>(`/cards/${cardId}`, token, { name }, "PUT");
}

export function createCard(listId: string, name: string, token: string) {
  return trelloFetch<TrelloCard>("/cards", token, { idList: listId, name }, "POST");
}

export function archiveCard(cardId: string, token: string) {
  return trelloFetch<TrelloCard>(`/cards/${cardId}`, token, { closed: "true" }, "PUT");
}
