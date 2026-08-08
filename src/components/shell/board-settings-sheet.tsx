"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Settings02Icon } from "@hugeicons/core-free-icons";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LabelManagerRow } from "@/components/shell/label-manager-row";
import type { TrelloLabel } from "@/lib/trello/types";

export function BoardSettingsSheet({ boardId }: { boardId: string }) {
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<TrelloLabel[] | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open || labels !== null) return;
    fetch(`/api/boards/${boardId}/labels`)
      .then((res) => res.json())
      .then((data) => setLabels(data.labels));
  }, [open, boardId, labels]);

  async function addLabel() {
    setCreating(true);
    const res = await fetch(`/api/boards/${boardId}/labels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", color: "green" }),
    });
    setCreating(false);
    if (!res.ok) return;
    const { label } = await res.json();
    setLabels((prev) => [...(prev ?? []), label]);
  }

  function handleChanged(next: TrelloLabel) {
    setLabels((prev) => prev?.map((l) => (l.id === next.id ? next : l)) ?? prev);
  }

  function handleDeleted(labelId: string) {
    setLabels((prev) => prev?.filter((l) => l.id !== labelId) ?? prev);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <HugeiconsIcon icon={Settings02Icon} size={16} />
      </button>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Board Settings</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4 pb-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Labels</p>
            <Button variant="ghost" size="xs" className="gap-1 text-muted-foreground" onClick={addLabel} disabled={creating}>
              <HugeiconsIcon icon={Add01Icon} size={12} />
              New label
            </Button>
          </div>
          <div className="flex flex-col gap-0.5">
            {labels === null && <p className="text-sm text-muted-foreground">Loading…</p>}
            {labels?.map((label) => (
              <LabelManagerRow key={label.id} label={label} onChanged={handleChanged} onDeleted={handleDeleted} />
            ))}
            {labels?.length === 0 && <p className="text-sm text-muted-foreground">No labels yet.</p>}
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">More board settings will show up here over time.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
