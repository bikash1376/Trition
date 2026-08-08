import { getBoardLists, getListCards, getMe, getMyBoards, createList } from "@/lib/trello/client";
import { requireToken, withAuthGuard } from "@/lib/trello/guard";
import { HOME_LIST_NAME } from "@/lib/trello/blocks";
import { AppShell } from "@/components/shell/app-shell";
import { WorkspaceSidebar } from "@/components/shell/workspace-sidebar";
import { BlockCanvas } from "@/components/blocks/block-canvas";

export default async function BoardHomePage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const token = await requireToken();

  const [me, boards, lists] = await withAuthGuard(
    Promise.all([getMe(token), getMyBoards(token), getBoardLists(boardId, token)]),
  );

  const homeList = lists.find((l) => l.name === HOME_LIST_NAME) ?? (await withAuthGuard(createList(boardId, HOME_LIST_NAME, token)));
  const pages = lists.filter((l) => l.id !== homeList.id);
  const board = boards.find((b) => b.id === boardId);

  const cards = await withAuthGuard(getListCards(homeList.id, token));
  const pageNames = Object.fromEntries(pages.map((l) => [l.id, l.name]));

  return (
    <AppShell
      sidebar={<WorkspaceSidebar me={me} boards={boards} activeBoardId={boardId} lists={pages} isHome />}
    >
      <BlockCanvas
        boardId={boardId}
        listId={homeList.id}
        pageTitle={board?.name ?? "Workspace"}
        cards={cards}
        pageNames={pageNames}
      />
    </AppShell>
  );
}
