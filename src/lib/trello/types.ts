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
  idMembers: string[];
  labels: TrelloLabel[];
  due: string | null;
  closed: boolean;
  shortUrl: string;
}

export interface TrelloCommentAction {
  id: string;
  date: string;
  data: { text: string };
  memberCreator: TrelloMember;
}
