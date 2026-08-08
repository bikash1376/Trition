import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export function AvatarStack({ members }: { members: TrelloMember[] }) {
  if (members.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex -space-x-1.5">
      {members.map((member) => (
        <MemberAvatar key={member.id} member={member} className="h-6 w-6 border-2 border-background" />
      ))}
    </div>
  );
}
