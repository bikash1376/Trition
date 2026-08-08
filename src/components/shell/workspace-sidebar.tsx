import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building03Icon, Home01Icon, LockedIcon, Logout03Icon } from "@hugeicons/core-free-icons";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { DaSpaceMark } from "@/components/icons";
import { SidebarPageLink } from "@/components/shell/sidebar-page-link";
import { NavLinkSpinner } from "@/components/shell/nav-link-spinner";
import { CreateWorkspaceButton } from "@/components/shell/create-workspace-button";
import { NewPageButton } from "@/components/shell/new-page-button";
import type { TrelloBoard, TrelloList, TrelloMember } from "@/lib/trello/types";

interface WorkspaceSidebarProps {
  me: TrelloMember;
  boards: TrelloBoard[];
  homeActive: boolean;
  activeBoardId?: string;
  pageHrefBase: string;
  pagesBoardId: string;
  lists: TrelloList[];
  activeListId?: string;
}

export function WorkspaceSidebar({
  me,
  boards,
  homeActive,
  activeBoardId,
  pageHrefBase,
  pagesBoardId,
  lists,
  activeListId,
}: WorkspaceSidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-3 py-3">
        <DaSpaceMark className="h-5 w-5" />
        <span className="text-sm font-semibold">DaSpace</span>
      </div>

      <Separator className="bg-sidebar-border" />

      <div className="px-2 py-2">
        <Link
          href="/home"
          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
            homeActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60"
          }`}
        >
          <HugeiconsIcon icon={Home01Icon} size={16} className="shrink-0" />
          Home
          <NavLinkSpinner />
        </Link>
        <CreateWorkspaceButton />
      </div>

      <Separator className="bg-sidebar-border" />

      <ScrollArea className="flex-1">
        <div className="px-2 py-2">
          <p className="px-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Workspaces
          </p>
          <nav className="flex flex-col gap-0.5">
            {boards.map((board) => (
              <Link
                key={board.id}
                href={`/b/${board.id}`}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                  board.id === activeBoardId
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/60"
                }`}
              >
                <HugeiconsIcon icon={Building03Icon} size={16} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">{board.name}</span>
                {board.prefs?.permissionLevel === "private" && (
                  <HugeiconsIcon icon={LockedIcon} size={12} className="shrink-0 text-muted-foreground" />
                )}
                <NavLinkSpinner />
              </Link>
            ))}
          </nav>
        </div>

        <Separator className="bg-sidebar-border" />

        <div className="px-2 py-2">
          <div className="flex items-center justify-between px-2 pb-1">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Pages</p>
            <NewPageButton boardId={pagesBoardId} pageHrefBase={pageHrefBase} />
          </div>
          <nav className="flex flex-col gap-0.5">
            {lists.map((list) => (
              <SidebarPageLink
                key={list.id}
                listId={list.id}
                href={`${pageHrefBase}/l/${list.id}`}
                name={list.name}
                active={list.id === activeListId}
              />
            ))}
            {lists.length === 0 && (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                {homeActive ? "No personal pages yet." : "No pages on this board yet."}
              </p>
            )}
          </nav>
        </div>
      </ScrollArea>

      <Separator className="bg-sidebar-border" />

      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-[11px] font-medium">
          {(me.fullName || me.username || "?").charAt(0).toUpperCase()}
        </div>
        <span className="flex-1 truncate text-sm">{me.fullName || me.username}</span>
      </div>
      <form action="/api/auth/logout" method="post" className="px-2 pb-2">
        <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2">
          <HugeiconsIcon icon={Logout03Icon} size={16} />
          Log out
        </Button>
      </form>
    </aside>
  );
}
