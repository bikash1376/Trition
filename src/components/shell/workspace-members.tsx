import { MemberAvatar } from "@/components/table/avatar-stack";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import type { TrelloBoardMembership } from "@/lib/trello/types";

const ROLE_LABEL: Record<string, string> = { admin: "Admin", normal: "Member", observer: "Observer" };

export function WorkspaceMembers({ memberships }: { memberships: TrelloBoardMembership[] }) {
  if (memberships.length === 0) return null;
  return (
    <div className="flex -space-x-1.5">
      {memberships.map((m) => (
        <HoverCard key={m.id}>
          <HoverCardTrigger render={<span />}>
            <MemberAvatar member={m.member} className="h-7 w-7 border-2 border-background" />
          </HoverCardTrigger>
          <HoverCardContent className="flex w-56 items-center gap-3 p-3">
            <MemberAvatar member={m.member} className="h-10 w-10" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{m.member.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{ROLE_LABEL[m.memberType] ?? m.memberType}</p>
            </div>
          </HoverCardContent>
        </HoverCard>
      ))}
    </div>
  );
}
