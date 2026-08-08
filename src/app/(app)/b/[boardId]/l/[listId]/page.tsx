import { redirect } from "next/navigation";
import { getBoardLabels, getBoardLists, getBoardMembers, getCardCreator, getListCards, getMe } from "@/lib/trello/client";
import { requireToken, withAuthGuard } from "@/lib/trello/guard";
import { HOME_LIST_NAME, isCanvasList } from "@/lib/trello/blocks";
import { CardTable } from "@/components/table/card-table";
import { BlockCanvas } from "@/components/blocks/block-canvas";

export default async function ListPage({
  params,
}: {
  params: Promise<{ boardId: string; listId: string }>;
}) {
  const { boardId, listId } = await params;
  const token = await requireToken();

  const [me, lists, cards] = await withAuthGuard(
    Promise.all([getMe(token), getBoardLists(boardId, token), getListCards(listId, token)]),
  );

  const activeList = lists.find((list) => list.id === listId);
  if (!activeList || activeList.name === HOME_LIST_NAME) redirect(`/b/${boardId}`);

  if (isCanvasList(cards.map((card) => card.desc))) {
    const pages = lists.filter((list) => list.name !== HOME_LIST_NAME);
    const pageNames = Object.fromEntries(pages.map((list) => [list.id, list.name]));
    return (
      <BlockCanvas
        boardId={boardId}
        listId={listId}
        pageHrefBase={`/b/${boardId}`}
        pageTitle={activeList.name}
        cards={cards}
        pageNames={pageNames}
        me={me}
        titleEditable
      />
    );
  }

  const [members, labels] = await withAuthGuard(
    Promise.all([getBoardMembers(boardId, token), getBoardLabels(boardId, token)]),
  );
  const creators = await withAuthGuard(Promise.all(cards.map((card) => getCardCreator(card.id, token))));
  const rows = cards.map((card, i) => ({ card, creator: creators[i] }));

  return <CardTable listId={listId} pageTitle={activeList.name} rows={rows} members={members} labels={labels} me={me} />;
}
