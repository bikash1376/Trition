import { createBoard, createList, getBoardLists, getListCards, getMe, getMyBoards } from "@/lib/trello/client";
import { requireToken, withAuthGuard } from "@/lib/trello/guard";
import { HOME_LIST_NAME, PERSONAL_BOARD_NAME } from "@/lib/trello/blocks";
import { AppShell } from "@/components/shell/app-shell";
import { WorkspaceSidebar } from "@/components/shell/workspace-sidebar";
import { BlockCanvas } from "@/components/blocks/block-canvas";

export default async function HomePage() {
  const token = await requireToken();

  const [me, allBoards] = await withAuthGuard(Promise.all([getMe(token), getMyBoards(token)]));
  const boards = allBoards.filter((b) => b.name !== PERSONAL_BOARD_NAME);

  const personalBoard =
    allBoards.find((b) => b.name === PERSONAL_BOARD_NAME) ??
    (await withAuthGuard(createBoard(PERSONAL_BOARD_NAME, token)));

  const lists = await withAuthGuard(getBoardLists(personalBoard.id, token));
  const homeList =
    lists.find((l) => l.name === HOME_LIST_NAME) ??
    (await withAuthGuard(createList(personalBoard.id, HOME_LIST_NAME, token)));
  const pages = lists.filter((l) => l.id !== homeList.id);

  const cards = await withAuthGuard(getListCards(homeList.id, token));
  const pageNames = Object.fromEntries(pages.map((l) => [l.id, l.name]));

  return (
    <AppShell
      sidebar={
        <WorkspaceSidebar
          me={me}
          boards={boards}
          homeActive
          pageHrefBase="/home"
          pagesBoardId={personalBoard.id}
          lists={pages}
        />
      }
    >
      <BlockCanvas
        boardId={personalBoard.id}
        listId={homeList.id}
        pageHrefBase="/home"
        pageTitle="Home"
        cards={cards}
        pageNames={pageNames}
        me={me}
      />
    </AppShell>
  );
}
