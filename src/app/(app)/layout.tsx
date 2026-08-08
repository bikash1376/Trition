import { getMe, getMyBoards } from "@/lib/trello/client";
import { requireToken, withAuthGuard } from "@/lib/trello/guard";
import { PERSONAL_BOARD_NAME } from "@/lib/trello/blocks";
import { AppShell } from "@/components/shell/app-shell";
import { WorkspaceSidebarShell } from "@/components/shell/workspace-sidebar-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const token = await requireToken();
  const [me, allBoards] = await withAuthGuard(Promise.all([getMe(token), getMyBoards(token)]));
  const boards = allBoards.filter((b) => b.name !== PERSONAL_BOARD_NAME);

  return <AppShell sidebar={<WorkspaceSidebarShell me={me} boards={boards} />}>{children}</AppShell>;
}
