"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { MeetingRoomIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MemberAvatar } from "@/components/table/avatar-stack";
import type { TrelloMember } from "@/lib/trello/types";

interface ActivityEntry {
  id: string;
  member: TrelloMember;
  verb: string;
  pageName: string;
  date: string;
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function LobbyButton({ boardId }: { boardId: string }) {
  const [entries, setEntries] = useState<ActivityEntry[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || entries !== null) return;
    fetch(`/api/boards/${boardId}/activity`)
      .then((res) => (res.ok ? res.json() : { entries: [] }))
      .then((data) => setEntries(data.entries ?? []));
  }, [open, boardId, entries]);

  const latest = entries?.[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <HugeiconsIcon icon={MeetingRoomIcon} size={14} />
        In lobby
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-3">
        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Recent activity</p>
        {entries === null && <p className="text-sm text-muted-foreground">Loading…</p>}
        {entries?.length === 0 && <p className="text-sm text-muted-foreground">No recent activity yet.</p>}
        {latest && (
          <div className="mb-2 flex items-center gap-2 rounded-md bg-accent/60 px-2 py-2">
            <MemberAvatar member={latest.member} className="h-6 w-6 shrink-0" />
            <p className="text-sm">
              <span className="font-medium">{latest.member.fullName}</span> {latest.verb}{" "}
              <span className="font-medium">{latest.pageName}</span>
              <span className="text-muted-foreground"> · {timeAgo(latest.date)}</span>
            </p>
          </div>
        )}
        {entries && entries.length > 1 && (
          <div className="flex flex-col gap-1.5">
            {entries.slice(1).map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 text-xs">
                <MemberAvatar member={entry.member} className="h-5 w-5 shrink-0" />
                <p className="min-w-0 flex-1 truncate text-muted-foreground">
                  <span className="text-foreground">{entry.member.fullName}</span> {entry.verb}{" "}
                  <span className="text-foreground">{entry.pageName}</span> · {timeAgo(entry.date)}
                </p>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
