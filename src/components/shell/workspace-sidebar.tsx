import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building03Icon, File01Icon, Logout03Icon } from "@hugeicons/core-free-icons";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { DaSpaceMark } from "@/components/icons";
import type { TrelloBoard, TrelloList, TrelloMember } from "@/lib/trello/types";

interface WorkspaceSidebarProps {
  me: TrelloMember;
  boards: TrelloBoard[];
  activeBoardId: string;
  lists: TrelloList[];
  activeListId?: string;
}

export function WorkspaceSidebar({ me, boards, activeBoardId, lists, activeListId }: WorkspaceSidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-3 py-3">
        <DaSpaceMark className="h-5 w-5" />
        <span className="text-sm font-semibold">DaSpace</span>
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
                <span className="truncate">{board.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        <Separator className="bg-sidebar-border" />

        <div className="px-2 py-2">
          <p className="px-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Pages</p>
          <nav className="flex flex-col gap-0.5">
            {lists.map((list) => (
              <Link
                key={list.id}
                href={`/b/${activeBoardId}/l/${list.id}`}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                  list.id === activeListId
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/60"
                }`}
              >
                <HugeiconsIcon icon={File01Icon} size={16} className="shrink-0" />
                <span className="truncate">{list.name}</span>
              </Link>
            ))}
            {lists.length === 0 && (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">No pages on this board yet.</p>
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

