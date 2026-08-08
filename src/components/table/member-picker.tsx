"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AvatarStack, MemberAvatar } from "@/components/table/avatar-stack";
import type { TrelloMember } from "@/lib/trello/types";

interface MemberPickerProps {
  cardId: string;
  selected: TrelloMember[];
  options: TrelloMember[];
  onChange: (members: TrelloMember[]) => void;
}

export function MemberPicker({ cardId, selected, options, onChange }: MemberPickerProps) {
  const selectedIds = new Set(selected.map((m) => m.id));

  async function toggle(member: TrelloMember) {
    const isSelected = selectedIds.has(member.id);
    onChange(isSelected ? selected.filter((m) => m.id !== member.id) : [...selected, member]);
    await fetch(`/api/cards/${cardId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: member.id, add: !isSelected }),
    });
  }

  return (
    <Popover>
      <PopoverTrigger onClick={(e: React.MouseEvent) => e.stopPropagation()} className="block cursor-pointer">
        <div className="flex items-center gap-1">
          <AvatarStack members={selected} />
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/50 text-muted-foreground hover:border-foreground hover:text-foreground">
            <HugeiconsIcon icon={Add01Icon} size={11} />
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1" onClick={(e) => e.stopPropagation()}>
        {options.length === 0 && <p className="px-2 py-1.5 text-xs text-muted-foreground">No board members.</p>}
        {options.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => toggle(member)}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
          >
            <MemberAvatar member={member} className="h-5 w-5" />
            <span className="flex-1 truncate">{member.fullName}</span>
            {selectedIds.has(member.id) && <span className="text-xs text-muted-foreground">✓</span>}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
