import { createList, getBoard, getBoardLists, getBoardMemberships, getListCards, getMe } from "@/lib/trello/client";
import { requireToken, withAuthGuard } from "@/lib/trello/guard";
import { HOME_LIST_NAME } from "@/lib/trello/blocks";
import { BlockCanvas } from "@/components/blocks/block-canvas";

export default async function BoardHomePage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const token = await requireToken();

  const [me, board, lists, memberships] = await withAuthGuard(
    Promise.all([
      getMe(token),
      getBoard(boardId, token),
      getBoardLists(boardId, token),
      getBoardMemberships(boardId, token),
    ]),
  );

  const homeList =
    lists.find((l) => l.name === HOME_LIST_NAME) ?? (await withAuthGuard(createList(boardId, HOME_LIST_NAME, token)));
  const pages = lists.filter((l) => l.id !== homeList.id);

  const cards = await withAuthGuard(getListCards(homeList.id, token));
  const pageNames = Object.fromEntries(pages.map((l) => [l.id, l.name]));

  return (
    <BlockCanvas
      boardId={boardId}
      listId={homeList.id}
      pageHrefBase={`/b/${boardId}`}
      pageTitle={board.name}
      cards={cards}
      pageNames={pageNames}
      me={me}
      inviteBoardId={boardId}
      workspaceMemberships={memberships}
    />
  );
}
