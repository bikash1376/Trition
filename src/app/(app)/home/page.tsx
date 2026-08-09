import { createBoard, createList, getBoard, getBoardLists, getListCards, getMe, getMyBoards } from "@/lib/trello/client";
import { requireToken, withAuthGuard } from "@/lib/trello/guard";
import { HOME_LIST_NAME, PERSONAL_BOARD_NAME } from "@/lib/trello/blocks";
import { parseWorkspaceSettings } from "@/lib/trello/board-settings";
import { BlockCanvas } from "@/components/blocks/block-canvas";

export default async function HomePage() {
  const token = await requireToken();

  const [me, allBoards] = await withAuthGuard(Promise.all([getMe(token), getMyBoards(token)]));

  const personalBoard =
    allBoards.find((b) => b.name === PERSONAL_BOARD_NAME) ??
    (await withAuthGuard(createBoard(PERSONAL_BOARD_NAME, token)));

  const [lists, board] = await withAuthGuard(
    Promise.all([getBoardLists(personalBoard.id, token), getBoard(personalBoard.id, token)]),
  );
  const { settings } = parseWorkspaceSettings(board.desc);
  const homeList =
    lists.find((l) => l.name === HOME_LIST_NAME) ??
    (await withAuthGuard(createList(personalBoard.id, HOME_LIST_NAME, token)));
  const pages = lists.filter((l) => l.id !== homeList.id && !settings.tableListIds.includes(l.id));

  const cards = await withAuthGuard(getListCards(homeList.id, token));
  const pageNames = Object.fromEntries(pages.map((l) => [l.id, l.name]));

  return (
    <BlockCanvas
      boardId={personalBoard.id}
      listId={homeList.id}
      pageHrefBase="/home"
      pageTitle="Home"
      cards={cards}
      pageNames={pageNames}
      me={me}
    />
  );
}
