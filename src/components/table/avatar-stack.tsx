"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import type { TrelloMember } from "@/lib/trello/types";

export function MemberAvatar({ member, className }: { member: TrelloMember; className?: string }) {
  return (
    <Avatar className={className ?? "h-6 w-6"}>
      {member.avatarUrl && <AvatarImage src={`${member.avatarUrl}/50.png`} alt={member.fullName} />}
      <AvatarFallback className="text-[10px]">
        {(member.fullName || member.username || "?").charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function MemberHoverCard({ member, className }: { member: TrelloMember; className?: string }) {
  return (
    <HoverCard>
      <HoverCardTrigger render={<span />} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <MemberAvatar member={member} className={className} />
      </HoverCardTrigger>
      <HoverCardContent className="flex w-56 items-center gap-3 p-3">
        <MemberAvatar member={member} className="h-10 w-10" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{member.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">@{member.username}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export function AvatarStack({ members }: { members: TrelloMember[] }) {
  if (members.length === 0) return null;
  return (
    <div className="flex -space-x-1.5">
      {members.map((member) => (
        <MemberHoverCard key={member.id} member={member} className="h-6 w-6 border-2 border-background" />
      ))}
    </div>
  );
}
