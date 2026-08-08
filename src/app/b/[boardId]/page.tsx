import { redirect } from "next/navigation";
import { getBoardLists, getMe, getMyBoards } from "@/lib/trello/client";
import { requireToken, withAuthGuard } from "@/lib/trello/guard";
import { AppShell } from "@/components/shell/app-shell";
import { WorkspaceSidebar } from "@/components/shell/workspace-sidebar";

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const token = await requireToken();

  const [me, boards, lists] = await withAuthGuard(
    Promise.all([getMe(token), getMyBoards(token), getBoardLists(boardId, token)]),
  );

  if (lists.length > 0) redirect(`/b/${boardId}/l/${lists[0].id}`);

  return (
    <AppShell sidebar={<WorkspaceSidebar me={me} boards={boards} activeBoardId={boardId} lists={lists} />}>
      <div className="flex h-full items-center justify-center px-6">
        <div className="max-w-sm space-y-2 text-center">
          <h1 className="text-lg font-semibold">No pages on this board yet</h1>
          <p className="text-sm text-muted-foreground">Add a list in Trello to see it here as a page.</p>
        </div>
      </div>
    </AppShell>
  );
}
