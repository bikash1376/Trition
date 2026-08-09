import { redirect } from "next/navigation";
import {
  getBoardLabels,
  getBoardLists,
  getBoardMembers,
  getCardCreator,
  getListCards,
  getMe,
  getMyBoards,
} from "@/lib/trello/client";
import { requireToken, withAuthGuard } from "@/lib/trello/guard";
import { HOME_LIST_NAME, PERSONAL_BOARD_NAME, isBlockCard } from "@/lib/trello/blocks";
import { BlockCanvas } from "@/components/blocks/block-canvas";
import type { TrelloLabel, TrelloMember } from "@/lib/trello/types";

export default async function HomeListPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  const token = await requireToken();

  const [me, allBoards] = await withAuthGuard(Promise.all([getMe(token), getMyBoards(token)]));
  const personalBoard = allBoards.find((b) => b.name === PERSONAL_BOARD_NAME);
  if (!personalBoard) redirect("/home");

  const [lists, cards] = await withAuthGuard(
    Promise.all([getBoardLists(personalBoard.id, token), getListCards(listId, token)]),
  );

  const activeList = lists.find((list) => list.id === listId);
  if (!activeList || activeList.name === HOME_LIST_NAME) redirect("/home");

  const pages = lists.filter((list) => list.name !== HOME_LIST_NAME);
  const pageNames = Object.fromEntries(pages.map((list) => [list.id, list.name]));

  const tableCards = cards.filter((card) => !isBlockCard(card.desc));
  const blockCards = cards.filter((card) => isBlockCard(card.desc));

  let members: TrelloMember[] = [];
  let labels: TrelloLabel[] = [];
  let tableRows: { card: (typeof cards)[number]; creator: TrelloMember | null }[] = [];
  if (tableCards.length > 0) {
    [members, labels] = await withAuthGuard(
      Promise.all([getBoardMembers(personalBoard.id, token), getBoardLabels(personalBoard.id, token)]),
    );
    const creators = await withAuthGuard(Promise.all(tableCards.map((card) => getCardCreator(card.id, token))));
    tableRows = tableCards.map((card, i) => ({ card, creator: creators[i] }));
  }

  return (
    <BlockCanvas
      boardId={personalBoard.id}
      listId={listId}
      pageHrefBase="/home"
      pageTitle={activeList.name}
      cards={blockCards}
      pageNames={pageNames}
      me={me}
      titleEditable
      tableRows={tableRows}
      tableMembers={members}
      tableLabels={labels}
    />
  );
}
