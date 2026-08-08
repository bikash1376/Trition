"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building03Icon, Home01Icon, LockedIcon, Logout03Icon } from "@hugeicons/core-free-icons";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DaSpaceMark } from "@/components/icons";
import { SidebarPageLink } from "@/components/shell/sidebar-page-link";
import { NavLinkSpinner } from "@/components/shell/nav-link-spinner";
import { CreateWorkspaceButton } from "@/components/shell/create-workspace-button";
import { NewPageButton } from "@/components/shell/new-page-button";
import type { TrelloBoard, TrelloList, TrelloMember } from "@/lib/trello/types";

interface WorkspaceSidebarShellProps {
  me: TrelloMember;
  boards: TrelloBoard[];
}

function deriveContext(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "b" && segments[1]) {
    return {
      kind: "board" as const,
      boardId: segments[1],
      activeListId: segments[2] === "l" ? segments[3] : undefined,
      pageHrefBase: `/b/${segments[1]}`,
      pagesUrl: `/api/boards/${segments[1]}/pages`,
    };
  }
  return {
    kind: "home" as const,
    activeListId: segments[0] === "home" && segments[1] === "l" ? segments[2] : undefined,
    pageHrefBase: "/home",
    pagesUrl: "/api/home/pages",
  };
}

export function WorkspaceSidebarShell({ me, boards }: WorkspaceSidebarShellProps) {
  const pathname = usePathname();
  const context = deriveContext(pathname);

  const [pagesData, setPagesData] = useState<{ contextKey: string; lists: TrelloList[]; boardId: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    fetch(context.pagesUrl)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setPagesData({ contextKey: context.pagesUrl, lists: data.lists, boardId: data.boardId });
      });
    return () => {
      cancelled = true;
    };
  }, [context.pagesUrl]);

  const loadingPages = !pagesData || pagesData.contextKey !== context.pagesUrl;
  const pages = loadingPages ? null : pagesData;

  const homeActive = context.kind === "home";
  const activeBoardId = context.kind === "board" ? context.boardId : undefined;

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
            {pages && <NewPageButton boardId={pages.boardId} pageHrefBase={context.pageHrefBase} />}
          </div>
          {loadingPages || !pages ? (
            <div className="flex flex-col gap-1.5 px-2 py-1">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          ) : (
            <nav className="flex flex-col gap-0.5">
              {pages.lists.map((list) => (
                <SidebarPageLink
                  key={list.id}
                  listId={list.id}
                  href={`${context.pageHrefBase}/l/${list.id}`}
                  name={list.name}
                  active={list.id === context.activeListId}
                />
              ))}
              {pages.lists.length === 0 && (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                  {homeActive ? "No personal pages yet." : "No pages on this board yet."}
                </p>
              )}
            </nav>
          )}
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
