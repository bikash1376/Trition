import { redirect } from "next/navigation";
import {
  getBoard,
  getBoardLabels,
  getBoardLists,
  getBoardMembers,
  getCardCreator,
  getCardLastEditor,
  getListCards,
  getMe,
  getMyBoards,
} from "@/lib/trello/client";
import { requireToken, withAuthGuard } from "@/lib/trello/guard";
import { HOME_LIST_NAME, PERSONAL_BOARD_NAME, isBlockCard } from "@/lib/trello/blocks";
import { parseWorkspaceSettings } from "@/lib/trello/board-settings";
import { COLUMNS_SCHEMA_CARD_NAME, parseCardProps, parseColumnSchema, type CardProps, type ColumnDef } from "@/lib/trello/columns";
import { BlockCanvas } from "@/components/blocks/block-canvas";
import type { TrelloLabel, TrelloMember } from "@/lib/trello/types";

export default async function HomeListPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  const token = await requireToken();

  const [me, allBoards] = await withAuthGuard(Promise.all([getMe(token), getMyBoards(token)]));
  const personalBoard = allBoards.find((b) => b.name === PERSONAL_BOARD_NAME);
  if (!personalBoard) redirect("/home");

  const [lists, cards, board] = await withAuthGuard(
    Promise.all([getBoardLists(personalBoard.id, token), getListCards(listId, token), getBoard(personalBoard.id, token)]),
  );
  const { settings } = parseWorkspaceSettings(board.desc);

  const activeList = lists.find((list) => list.id === listId);
  if (!activeList || activeList.name === HOME_LIST_NAME) redirect("/home");

  const pages = lists.filter((list) => list.name !== HOME_LIST_NAME && !settings.tableListIds.includes(list.id));
  const pageNames = Object.fromEntries(pages.map((list) => [list.id, list.name]));

  const schemaCard = cards.find((card) => card.name === COLUMNS_SCHEMA_CARD_NAME);
  const tableCards = cards.filter((card) => !isBlockCard(card.desc) && card.name !== COLUMNS_SCHEMA_CARD_NAME);
  const blockCards = cards.filter((card) => isBlockCard(card.desc));
  const tableColumns: ColumnDef[] = schemaCard ? parseColumnSchema(schemaCard.desc) : [];

  let members: TrelloMember[] = [];
  let labels: TrelloLabel[] = [];
  let tableRows: { card: (typeof cards)[number]; creator: TrelloMember | null; lastEditor: TrelloMember | null; props: CardProps }[] =
    [];
  if (tableCards.length > 0) {
    [members, labels] = await withAuthGuard(
      Promise.all([getBoardMembers(personalBoard.id, token), getBoardLabels(personalBoard.id, token)]),
    );
    const creators = await withAuthGuard(Promise.all(tableCards.map((card) => getCardCreator(card.id, token))));
    const lastEditors = await withAuthGuard(Promise.all(tableCards.map((card) => getCardLastEditor(card.id, token))));
    tableRows = tableCards.map((card, i) => {
      const { props, rest } = parseCardProps(card.desc);
      return { card: { ...card, desc: rest }, creator: creators[i], lastEditor: lastEditors[i], props };
    });
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
      tableColumns={tableColumns}
    />
  );
}
