"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Image02Icon, Settings02Icon } from "@hugeicons/core-free-icons";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LabelManagerRow } from "@/components/shell/label-manager-row";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import type { TrelloLabel } from "@/lib/trello/types";

export interface BoardCover {
  cardId: string;
  attachmentId: string;
}

interface BoardSettingsSheetProps {
  boardId: string;
  homeListId: string;
  cover: BoardCover | null;
  onCoverChanged: (cover: BoardCover | null) => void;
}

export function BoardSettingsSheet({ boardId, homeListId, cover, onCoverChanged }: BoardSettingsSheetProps) {
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<TrelloLabel[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [removeCoverConfirmOpen, setRemoveCoverConfirmOpen] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

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

  function uploadCover(file: File) {
    setUploadingCover(true);
    const form = new FormData();
    form.append("file", file);
    form.append("homeListId", homeListId);
    fetch(`/api/boards/${boardId}/cover`, { method: "POST", body: form })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUploadingCover(false);
        if (data) onCoverChanged({ cardId: data.card.id, attachmentId: data.attachmentId });
      });
  }

  function removeCover() {
    onCoverChanged(null);
    fetch(`/api/boards/${boardId}/cover`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeListId }),
    });
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
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Cover image</p>
          {cover ? (
            <div className="relative h-24 w-full overflow-hidden rounded-md border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/attachments/${cover.cardId}/${cover.attachmentId}`}
                alt=""
                className="h-full w-full object-cover"
              />
              <Button
                variant="secondary"
                size="xs"
                className="absolute top-1.5 right-1.5"
                onClick={() => setRemoveCoverConfirmOpen(true)}
              >
                Remove
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-fit gap-1.5"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
            >
              <HugeiconsIcon icon={Image02Icon} size={14} />
              {uploadingCover ? "Uploading…" : "Add cover image"}
            </Button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadCover(file);
              e.target.value = "";
            }}
          />

          <Separator />

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
      <ConfirmDeleteDialog
        open={removeCoverConfirmOpen}
        onOpenChange={setRemoveCoverConfirmOpen}
        title="Remove cover image?"
        description="This removes the cover from your workspace home."
        confirmLabel="Remove"
        onConfirm={removeCover}
      />
    </Sheet>
  );
}
