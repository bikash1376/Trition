import { createList, getBoard, getBoardLists, getBoardMemberships, getListCards, getMe } from "@/lib/trello/client";
import { requireToken, withAuthGuard } from "@/lib/trello/guard";
import { COVER_CARD_NAME, HOME_LIST_NAME } from "@/lib/trello/blocks";
import { parseWorkspaceSettings } from "@/lib/trello/board-settings";
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
  const { settings } = parseWorkspaceSettings(board.desc);
  const pages = lists.filter((l) => l.id !== homeList.id && !settings.tableListIds.includes(l.id));

  const allCards = await withAuthGuard(getListCards(homeList.id, token));
  const coverCard = allCards.find((c) => c.name === COVER_CARD_NAME);
  const cards = allCards.filter((c) => c.name !== COVER_CARD_NAME);
  const pageNames = Object.fromEntries(pages.map((l) => [l.id, l.name]));
  const [coverAttachmentId, coverHeight] = coverCard?.desc.split("|") ?? [];

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
      cover={
        coverCard
          ? { cardId: coverCard.id, attachmentId: coverAttachmentId, heightPercent: Number(coverHeight) || 40 }
          : null
      }
    />
  );
}
