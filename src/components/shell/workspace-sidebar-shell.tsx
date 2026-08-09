"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Archive04Icon, CorporateIcon, Home01Icon, Logout03Icon, UserLock01Icon } from "@hugeicons/core-free-icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TextShimmer } from "@/components/better/text-shimmer";
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
      <div className="flex items-center px-3 py-4">
        <TextShimmer as="span" className="font-script text-2xl leading-none" duration={2.5}>
          Trition
        </TextShimmer>
      </div>

      <div className="px-2 py-3">
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

      <ScrollArea className="flex-1">
        <div className="flex h-full flex-col">
          <div className="px-2 py-3">
            <p className="px-2 pb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Workspaces
            </p>
            <nav className="flex flex-col gap-1">
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
                  <HugeiconsIcon
                    icon={board.prefs?.permissionLevel === "org" ? CorporateIcon : UserLock01Icon}
                    size={16}
                    className="shrink-0"
                  />
                  <span className="min-w-0 flex-1 truncate">{board.name}</span>
                  <NavLinkSpinner />
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-1 flex-col px-2 py-3">
            <p className="px-2 pb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Pages</p>
            {loadingPages || !pages ? (
              <div className="flex flex-col gap-1.5 px-2 py-1">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            ) : pages.lists.length === 0 ? (
              <NewPageButton
                boardId={pages.boardId}
                pageHrefBase={context.pageHrefBase}
                trigger={
                  <button
                    type="button"
                    className="flex flex-1 flex-col items-center justify-center gap-2 rounded-md text-muted-foreground hover:text-foreground"
                  />
                }
              >
                <HugeiconsIcon icon={Archive04Icon} size={22} />
                <span className="text-sm">Create New</span>
              </NewPageButton>
            ) : (
              <nav className="flex flex-col gap-1">
                {pages.lists.map((list) => (
                  <SidebarPageLink
                    key={list.id}
                    listId={list.id}
                    href={`${context.pageHrefBase}/l/${list.id}`}
                    name={list.name}
                    active={list.id === context.activeListId}
                  />
                ))}
              </nav>
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="flex items-center justify-between gap-2 px-3 py-4">
        <span className="min-w-0 flex-1 truncate text-sm">{me.fullName || me.username}</span>
        <form action="/api/auth/logout" method="post">
          <Button type="submit" variant="ghost" size="icon-sm" title="Log out">
            <HugeiconsIcon icon={Logout03Icon} size={16} />
          </Button>
        </form>
      </div>
    </aside>
  );
}
