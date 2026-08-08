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
import { HOME_LIST_NAME } from "@/lib/trello/blocks";
import { AppShell } from "@/components/shell/app-shell";
import { WorkspaceSidebar } from "@/components/shell/workspace-sidebar";
import { CardTable } from "@/components/table/card-table";

export default async function ListPage({
  params,
}: {
  params: Promise<{ boardId: string; listId: string }>;
}) {
  const { boardId, listId } = await params;
  const token = await requireToken();

  const [me, boards, lists, members, labels, cards] = await withAuthGuard(
    Promise.all([
      getMe(token),
      getMyBoards(token),
      getBoardLists(boardId, token),
      getBoardMembers(boardId, token),
      getBoardLabels(boardId, token),
      getListCards(listId, token),
    ]),
  );

  const activeList = lists.find((list) => list.id === listId);
  if (!activeList || activeList.name === HOME_LIST_NAME) redirect(`/b/${boardId}`);

  const pages = lists.filter((list) => list.name !== HOME_LIST_NAME);

  const creators = await withAuthGuard(Promise.all(cards.map((card) => getCardCreator(card.id, token))));
  const rows = cards.map((card, i) => ({ card, creator: creators[i] }));

  return (
    <AppShell
      sidebar={
        <WorkspaceSidebar me={me} boards={boards} activeBoardId={boardId} lists={pages} activeListId={listId} />
      }
    >
      <CardTable listId={listId} pageTitle={activeList.name} rows={rows} members={members} labels={labels} />
    </AppShell>
  );
}
