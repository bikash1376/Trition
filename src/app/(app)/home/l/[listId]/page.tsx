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
import { HOME_LIST_NAME, PERSONAL_BOARD_NAME, isCanvasList } from "@/lib/trello/blocks";
import { CardTable } from "@/components/table/card-table";
import { BlockCanvas } from "@/components/blocks/block-canvas";

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

  if (isCanvasList(cards.map((card) => card.desc))) {
    const pages = lists.filter((list) => list.name !== HOME_LIST_NAME);
    const pageNames = Object.fromEntries(pages.map((list) => [list.id, list.name]));
    return (
      <BlockCanvas
        boardId={personalBoard.id}
        listId={listId}
        pageHrefBase="/home"
        pageTitle={activeList.name}
        cards={cards}
        pageNames={pageNames}
        me={me}
        titleEditable
      />
    );
  }

  const [members, labels] = await withAuthGuard(
    Promise.all([getBoardMembers(personalBoard.id, token), getBoardLabels(personalBoard.id, token)]),
  );
  const creators = await withAuthGuard(Promise.all(cards.map((card) => getCardCreator(card.id, token))));
  const rows = cards.map((card, i) => ({ card, creator: creators[i] }));

  return <CardTable listId={listId} pageTitle={activeList.name} rows={rows} members={members} labels={labels} me={me} />;
}
