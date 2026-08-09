import { redirect } from "next/navigation";
import { getBoardLabels, getBoardLists, getBoardMembers, getCardCreator, getListCards, getMe } from "@/lib/trello/client";
import { requireToken, withAuthGuard } from "@/lib/trello/guard";
import { HOME_LIST_NAME, isBlockCard } from "@/lib/trello/blocks";
import { COLUMNS_SCHEMA_CARD_NAME, parseCardProps, parseColumnSchema, type CardProps, type ColumnDef } from "@/lib/trello/columns";
import { BlockCanvas } from "@/components/blocks/block-canvas";
import type { TrelloLabel, TrelloMember } from "@/lib/trello/types";

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

  const pages = lists.filter((list) => list.name !== HOME_LIST_NAME);
  const pageNames = Object.fromEntries(pages.map((list) => [list.id, list.name]));

  const schemaCard = cards.find((card) => card.name === COLUMNS_SCHEMA_CARD_NAME);
  const tableCards = cards.filter((card) => !isBlockCard(card.desc) && card.name !== COLUMNS_SCHEMA_CARD_NAME);
  const blockCards = cards.filter((card) => isBlockCard(card.desc));
  const tableColumns: ColumnDef[] = schemaCard ? parseColumnSchema(schemaCard.desc) : [];

  let members: TrelloMember[] = [];
  let labels: TrelloLabel[] = [];
  let tableRows: { card: (typeof cards)[number]; creator: TrelloMember | null; props: CardProps }[] = [];
  if (tableCards.length > 0) {
    [members, labels] = await withAuthGuard(
      Promise.all([getBoardMembers(boardId, token), getBoardLabels(boardId, token)]),
    );
    const creators = await withAuthGuard(Promise.all(tableCards.map((card) => getCardCreator(card.id, token))));
    tableRows = tableCards.map((card, i) => {
      const { props, rest } = parseCardProps(card.desc);
      return { card: { ...card, desc: rest }, creator: creators[i], props };
    });
  }

  return (
    <BlockCanvas
      boardId={boardId}
      listId={listId}
      pageHrefBase={`/b/${boardId}`}
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
