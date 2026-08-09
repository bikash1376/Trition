export interface TrelloMember {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
}

export interface TrelloBoard {
  id: string;
  name: string;
  url: string;
  closed: boolean;
  desc?: string;
  dateLastActivity?: string | null;
  prefs?: {
    permissionLevel: "private" | "org" | "public";
    comments?: "disabled" | "members" | "org" | "public";
    cardCovers?: boolean;
    selfJoin?: boolean;
  };
}

export interface TrelloList {
  id: string;
  name: string;
  closed: boolean;
  idBoard: string;
}

export interface TrelloLabel {
  id: string;
  name: string;
  color: string | null;
}

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  idList: string;
  idBoard: string;
  idMembers: string[];
  labels: TrelloLabel[];
  due: string | null;
  closed: boolean;
  shortUrl: string;
}

export interface TrelloAttachment {
  id: string;
  name: string;
  url: string;
  mimeType: string | null;
  bytes: number | null;
}

export interface TrelloBoardMembership {
  id: string;
  idMember: string;
  memberType: "admin" | "normal" | "observer";
  member: TrelloMember;
}

export interface TrelloCommentAction {
  id: string;
  date: string;
  data: { text: string };
  memberCreator: TrelloMember;
}

export interface TrelloBoardAction {
  id: string;
  type: string;
  date: string;
  memberCreator: TrelloMember;
  data: {
    card?: { id: string; name: string };
    list?: { id: string; name: string };
    board?: { id: string; name: string };
  };
}
