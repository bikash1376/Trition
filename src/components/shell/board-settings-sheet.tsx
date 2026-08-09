"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Copy01Icon, Image02Icon, Settings02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { LabelManagerRow } from "@/components/shell/label-manager-row";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { useSidebarRefresh } from "@/lib/sidebar-refresh";
import type { TrelloLabel } from "@/lib/trello/types";

export interface BoardCover {
  cardId: string;
  attachmentId: string;
  heightPercent: number;
}

interface WorkspaceSettings {
  showLastEditedColumn: boolean;
}

interface BoardPrefs {
  permissionLevel: "private" | "org" | "public";
  comments: "disabled" | "members" | "org" | "public";
  cardCovers: boolean;
  selfJoin: boolean;
}

const COVER_HEIGHTS = [25, 40, 50] as const;
const COMMENT_OPTIONS: { value: BoardPrefs["comments"]; label: string }[] = [
  { value: "disabled", label: "Off" },
  { value: "members", label: "Members" },
  { value: "org", label: "Workspace" },
  { value: "public", label: "Anyone" },
];

interface BoardSettingsSheetProps {
  boardId: string;
  boardName: string;
  homeListId: string;
  cover: BoardCover | null;
  onCoverChanged: (cover: BoardCover | null) => void;
}

export function BoardSettingsSheet({ boardId, boardName, homeListId, cover, onCoverChanged }: BoardSettingsSheetProps) {
  const router = useRouter();
  const { refreshSidebar } = useSidebarRefresh();
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<TrelloLabel[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [removeCoverConfirmOpen, setRemoveCoverConfirmOpen] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [prefs, setPrefs] = useState<BoardPrefs | null>(null);
  const [boardUrl, setBoardUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open || labels !== null) return;
    fetch(`/api/boards/${boardId}/labels`)
      .then((res) => res.json())
      .then((data) => setLabels(data.labels));
  }, [open, boardId, labels]);

  useEffect(() => {
    if (!open || settings !== null) return;
    fetch(`/api/boards/${boardId}/settings`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setSettings(data.settings);
        setPrefs(data.prefs);
        setBoardUrl(data.url ?? null);
      });
  }, [open, boardId, settings]);

  function copyLink() {
    if (!boardUrl) return;
    navigator.clipboard.writeText(boardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function deleteWorkspace() {
    setDeleting(true);
    const res = await fetch(`/api/boards/${boardId}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) return;
    setOpen(false);
    refreshSidebar();
    router.push("/home");
  }

  function patchSettings(body: Record<string, unknown>) {
    fetch(`/api/boards/${boardId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setSettings(data.settings);
        setPrefs(data.prefs);
      });
  }

  function toggleLastEditedColumn() {
    if (!settings) return;
    const next = { showLastEditedColumn: !settings.showLastEditedColumn };
    setSettings(next);
    patchSettings(next);
  }

  function setPermissionLevel(permissionLevel: BoardPrefs["permissionLevel"]) {
    if (!prefs) return;
    setPrefs({ ...prefs, permissionLevel });
    patchSettings({ permissionLevel });
  }

  function setComments(comments: BoardPrefs["comments"]) {
    if (!prefs) return;
    setPrefs({ ...prefs, comments });
    patchSettings({ comments });
  }

  function toggleCardCovers() {
    if (!prefs) return;
    const cardCovers = !prefs.cardCovers;
    setPrefs({ ...prefs, cardCovers });
    patchSettings({ cardCovers });
  }

  function toggleSelfJoin() {
    if (!prefs) return;
    const selfJoin = !prefs.selfJoin;
    setPrefs({ ...prefs, selfJoin });
    patchSettings({ selfJoin });
  }

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
    form.append("heightPercent", String(cover?.heightPercent ?? 40));
    fetch(`/api/boards/${boardId}/cover`, { method: "POST", body: form })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUploadingCover(false);
        if (data) onCoverChanged({ cardId: data.card.id, attachmentId: data.attachmentId, heightPercent: data.heightPercent });
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

  function setCoverHeight(heightPercent: number) {
    if (!cover) return;
    onCoverChanged({ ...cover, heightPercent });
    fetch(`/api/boards/${boardId}/cover`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeListId, heightPercent }),
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
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Board Settings</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4 pb-4">
          <p className="font-label text-sm tracking-wide text-muted-foreground">Cover image</p>
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
          ) : null}
          {cover && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Height</span>
              {COVER_HEIGHTS.map((h) => (
                <Button
                  key={h}
                  variant={cover.heightPercent === h ? "secondary" : "outline"}
                  size="xs"
                  onClick={() => setCoverHeight(h)}
                >
                  {h}%
                </Button>
              ))}
            </div>
          )}
          {!cover && (
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
            <p className="font-label text-sm tracking-wide text-muted-foreground">Labels</p>
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

          <p className="font-label text-sm tracking-wide text-muted-foreground">General (compatible with Trello)</p>
          {!prefs ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">Visibility</span>
                <div className="flex gap-1">
                  <Button
                    variant={prefs.permissionLevel === "private" ? "secondary" : "outline"}
                    size="xs"
                    onClick={() => setPermissionLevel("private")}
                  >
                    Private
                  </Button>
                  <Button
                    variant={prefs.permissionLevel === "public" ? "secondary" : "outline"}
                    size="xs"
                    onClick={() => setPermissionLevel("public")}
                  >
                    Public
                  </Button>
                </div>
              </div>
              {prefs.permissionLevel === "public" && boardUrl && (
                <div className="flex items-center gap-1.5">
                  <Input readOnly value={boardUrl} className="h-7 text-xs" onFocus={(e) => e.target.select()} />
                  <Button variant="outline" size="icon-xs" title="Copy public link" onClick={copyLink}>
                    <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={12} />
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">Who can comment</span>
                <div className="flex flex-wrap justify-end gap-1">
                  {COMMENT_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      variant={prefs.comments === opt.value ? "secondary" : "outline"}
                      size="xs"
                      onClick={() => setComments(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">Card covers</span>
                <Button variant={prefs.cardCovers ? "secondary" : "outline"} size="xs" onClick={toggleCardCovers}>
                  {prefs.cardCovers ? "On" : "Off"}
                </Button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">Anyone in workspace can join</span>
                <Button variant={prefs.selfJoin ? "secondary" : "outline"} size="xs" onClick={toggleSelfJoin}>
                  {prefs.selfJoin ? "On" : "Off"}
                </Button>
              </div>
            </div>
          )}

          <Separator />

          <p className="font-label text-sm tracking-wide text-muted-foreground">App settings (Trition)</p>
          {!settings ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm">Show &quot;Last Edited By&quot; column in tables</span>
              <Button
                variant={settings.showLastEditedColumn ? "secondary" : "outline"}
                size="xs"
                onClick={toggleLastEditedColumn}
              >
                {settings.showLastEditedColumn ? "On" : "Off"}
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">More board settings will show up here over time.</p>

          <Separator />

          <p className="font-label text-sm tracking-wide text-destructive">Danger zone</p>
          <div className="flex flex-col gap-2 rounded-md border border-destructive/30 p-3">
            <p className="text-sm font-medium">Delete this workspace</p>
            <p className="text-xs text-muted-foreground">
              Permanently deletes &quot;{boardName}&quot; from Trello — every page, table, card, and attachment in it.
              This cannot be undone.
            </p>
            <Input
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder={`Type "${boardName}" to confirm`}
              className="h-8 text-sm"
            />
            <Button
              variant="destructive"
              size="sm"
              className="w-fit"
              disabled={deleteConfirmName !== boardName || deleting}
              onClick={deleteWorkspace}
            >
              {deleting ? "Deleting…" : "Delete workspace forever"}
            </Button>
          </div>
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
