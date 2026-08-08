import { trelloApiKey } from "./env";
import { cached } from "./cache";
import type {
  TrelloAttachment,
  TrelloBoard,
  TrelloBoardMembership,
  TrelloCard,
  TrelloCommentAction,
  TrelloLabel,
  TrelloList,
  TrelloMember,
} from "./types";

const TTL = 60_000;
const LONG_TTL = 60 * 60_000;

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
  jsonBody?: unknown,
): Promise<T> {
  const url = new URL(BASE_URL + path);
  url.searchParams.set("key", trelloApiKey());
  url.searchParams.set("token", token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const init: RequestInit = { method, cache: "no-store" };
  if (jsonBody !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(jsonBody);
  }

  const res = await fetch(url.toString(), init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new TrelloApiError(res.status, text || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function getMe(token: string) {
  return cached(`me:${token}`, TTL, () =>
    trelloFetch<TrelloMember>("/members/me", token, {
      fields: "fullName,username,avatarUrl",
    }),
  );
}

export function getMyBoards(token: string) {
  return cached(`my-boards:${token}`, TTL, () =>
    trelloFetch<TrelloBoard[]>("/members/me/boards", token, {
      fields: "name,url,closed,prefs",
      filter: "open",
    }),
  );
}

export function getBoard(boardId: string, token: string) {
  return trelloFetch<TrelloBoard>(`/boards/${boardId}`, token, {
    fields: "name,url,closed",
  });
}

export function createBoard(
  name: string,
  token: string,
  permissionLevel: "private" | "public" = "private",
) {
  return trelloFetch<TrelloBoard>(
    "/boards",
    token,
    { name, defaultLists: "false", prefs_permissionLevel: permissionLevel },
    "POST",
  );
}

export function inviteBoardMember(boardId: string, email: string, token: string) {
  return trelloFetch<TrelloBoard>(
    `/boards/${boardId}/members`,
    token,
    { email, type: "normal" },
    "PUT",
  );
}

export function getList(listId: string, token: string) {
  return trelloFetch<TrelloList>(`/lists/${listId}`, token, {
    fields: "name,closed,idBoard",
  });
}

export function getBoardLists(boardId: string, token: string) {
  return trelloFetch<TrelloList[]>(`/boards/${boardId}/lists`, token, {
    fields: "name,closed,idBoard",
    filter: "open",
  });
}

export function getBoardMembers(boardId: string, token: string) {
  return cached(`board-members:${boardId}:${token}`, TTL, () =>
    trelloFetch<TrelloMember[]>(`/boards/${boardId}/members`, token, {
      fields: "fullName,username,avatarUrl",
    }),
  );
}

export function getBoardMemberships(boardId: string, token: string) {
  return cached(`board-memberships:${boardId}:${token}`, TTL, () =>
    trelloFetch<TrelloBoardMembership[]>(`/boards/${boardId}/memberships`, token, {
      member: "true",
      member_fields: "fullName,username,avatarUrl",
    }),
  );
}

export function createList(boardId: string, name: string, token: string) {
  return trelloFetch<TrelloList>("/lists", token, { name, idBoard: boardId }, "POST");
}

export function getListCards(listId: string, token: string) {
  return trelloFetch<TrelloCard[]>(`/lists/${listId}/cards`, token, {
    fields: "name,desc,idList,idBoard,idMembers,labels,due,closed,shortUrl",
  });
}

export function getCard(cardId: string, token: string) {
  return trelloFetch<TrelloCard>(`/cards/${cardId}`, token, {
    fields: "name,desc,idList,idBoard,idMembers,labels,due,closed,shortUrl",
  });
}

export function getCardMembers(cardId: string, token: string) {
  return trelloFetch<TrelloMember[]>(`/cards/${cardId}/members`, token, {
    fields: "fullName,username,avatarUrl",
  });
}

export function getCardAttachments(cardId: string, token: string) {
  return trelloFetch<TrelloAttachment[]>(`/cards/${cardId}/attachments`, token, {
    fields: "name,url,mimeType,bytes",
  });
}

export async function uploadCardAttachment(cardId: string, file: File, token: string) {
  const url = new URL(`${BASE_URL}/cards/${cardId}/attachments`);
  url.searchParams.set("key", trelloApiKey());
  url.searchParams.set("token", token);

  const form = new FormData();
  form.append("file", file, file.name);

  const res = await fetch(url.toString(), { method: "POST", body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new TrelloApiError(res.status, text || res.statusText);
  }
  return res.json() as Promise<TrelloAttachment>;
}

export function getBoardLabels(boardId: string, token: string) {
  return cached(`board-labels:${boardId}:${token}`, TTL, () =>
    trelloFetch<TrelloLabel[]>(`/boards/${boardId}/labels`, token, {
      fields: "name,color",
      limit: "1000",
    }),
  );
}

export function createLabel(boardId: string, name: string, color: string | null, token: string) {
  return trelloFetch<TrelloLabel>(
    "/labels",
    token,
    { idBoard: boardId, name, color: color ?? "null" },
    "POST",
  );
}

export function updateLabel(labelId: string, name: string, color: string | null, token: string) {
  return trelloFetch<TrelloLabel>(`/labels/${labelId}`, token, { name, color: color ?? "null" }, "PUT");
}

export function deleteLabel(labelId: string, token: string) {
  return trelloFetch<void>(`/labels/${labelId}`, token, {}, "DELETE");
}

export function addCardLabel(cardId: string, labelId: string, token: string) {
  return trelloFetch<TrelloLabel[]>(`/cards/${cardId}/idLabels`, token, { value: labelId }, "POST");
}

export function removeCardLabel(cardId: string, labelId: string, token: string) {
  return trelloFetch<{ _value: null }>(`/cards/${cardId}/idLabels/${labelId}`, token, {}, "DELETE");
}

export function addCardMember(cardId: string, memberId: string, token: string) {
  return trelloFetch<TrelloMember[]>(`/cards/${cardId}/idMembers`, token, { value: memberId }, "POST");
}

export function removeCardMember(cardId: string, memberId: string, token: string) {
  return trelloFetch<{ _value: null }>(`/cards/${cardId}/idMembers/${memberId}`, token, {}, "DELETE");
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

export function getCardCreator(cardId: string, token: string): Promise<TrelloMember | null> {
  return cached(`card-creator:${cardId}`, LONG_TTL, async () => {
    const actions = await trelloFetch<CreatorAction[]>(`/cards/${cardId}/actions`, token, {
      filter: "createCard,copyCard",
      limit: "1",
      memberCreator_fields: "fullName,username,avatarUrl",
    });
    return actions[0]?.memberCreator ?? null;
  });
}

export async function getCardLastEditor(cardId: string, token: string): Promise<TrelloMember | null> {
  const actions = await trelloFetch<CreatorAction[]>(`/cards/${cardId}/actions`, token, {
    limit: "1",
    memberCreator_fields: "fullName,username,avatarUrl",
  });
  return actions[0]?.memberCreator ?? null;
}

export function updateListName(listId: string, name: string, token: string) {
  return trelloFetch<TrelloList>(`/lists/${listId}`, token, { name }, "PUT");
}

export function updateCardName(cardId: string, name: string, token: string) {
  return trelloFetch<TrelloCard>(`/cards/${cardId}`, token, { name }, "PUT");
}

export function updateCardDesc(cardId: string, desc: string, token: string) {
  return trelloFetch<TrelloCard>(`/cards/${cardId}`, token, { desc }, "PUT");
}

export function createCard(listId: string, name: string, token: string, desc?: string) {
  const params: Record<string, string> = { idList: listId, name };
  if (desc) params.desc = desc;
  return trelloFetch<TrelloCard>("/cards", token, params, "POST");
}

export function archiveCard(cardId: string, token: string) {
  return trelloFetch<TrelloCard>(`/cards/${cardId}`, token, { closed: "true" }, "PUT");
}

export function archiveList(listId: string, token: string) {
  return trelloFetch<TrelloList>(`/lists/${listId}`, token, { closed: "true" }, "PUT");
}
