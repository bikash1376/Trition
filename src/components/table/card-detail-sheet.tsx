"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon } from "@hugeicons/core-free-icons";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MemberAvatar } from "@/components/table/avatar-stack";
import { CardAttachments } from "@/components/table/card-attachments";
import { LabelPicker } from "@/components/table/label-picker";
import { MemberPicker } from "@/components/table/member-picker";
import { StatusPills } from "@/components/table/status-pills";
import { MarkdownEditor } from "@/components/markdown-editor";
import { readLocalCache, writeLocalCache } from "@/lib/local-cache";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";
import type { TrelloAttachment, TrelloCard, TrelloCommentAction, TrelloLabel, TrelloMember } from "@/lib/trello/types";

const BOARD_LABELS_TTL = 10 * 60_000;
const SAVE_DEBOUNCE_MS = 10_000;

interface CardDetail {
  card: TrelloCard;
  members: TrelloMember[];
  creator: TrelloMember | null;
  lastEditor: TrelloMember | null;
  comments: TrelloCommentAction[];
  attachments: TrelloAttachment[];
}

interface CardDetailSheetProps {
  cardId: string | null;
  boardMembers: TrelloMember[];
  onOpenChange: (open: boolean) => void;
  onRenamed: (cardId: string, name: string) => void;
  onArchived: (cardId: string) => void;
  onMembersChanged: (cardId: string, members: TrelloMember[]) => void;
}

export function CardDetailSheet({
  cardId,
  boardMembers,
  onOpenChange,
  onRenamed,
  onArchived,
  onMembersChanged,
}: CardDetailSheetProps) {
  const [detail, setDetail] = useState<CardDetail | null>(null);
  const [boardLabels, setBoardLabels] = useState<TrelloLabel[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [descStatus, setDescStatus] = useState<"idle" | "pending" | "saved">("idle");
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!cardId) return;

    let cancelled = false;

    fetch(`/api/cards/${cardId}`)
      .then((res) => res.json())
      .then(async (data: CardDetail) => {
        if (cancelled) return;
        setDetail(data);
        setName(data.card.name);
        setDesc(data.card.desc);
        setDescStatus("idle");

        const cacheKey = `daspace:board-labels:${data.card.idBoard}`;
        const fromCache = readLocalCache<TrelloLabel[]>(cacheKey);
        if (fromCache) {
          setBoardLabels(fromCache);
          return;
        }
        const res = await fetch(`/api/boards/${data.card.idBoard}/labels`);
        if (!res.ok || cancelled) return;
        const { labels } = await res.json();
        setBoardLabels(labels);
        writeLocalCache(cacheKey, labels, BOARD_LABELS_TTL);
      });

    return () => {
      cancelled = true;
    };
  }, [cardId]);

  async function saveName() {
    if (!cardId || !detail || name.trim() === detail.card.name) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setName(detail.card.name);
      return;
    }
    await fetch(`/api/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    onRenamed(cardId, trimmed);
    setDetail({ ...detail, card: { ...detail.card, name: trimmed } });
  }

  const [debouncedSaveDesc] = useDebouncedCallback(async (id: string, value: string) => {
    setDescStatus("pending");
    await fetch(`/api/cards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ desc: value }),
    });
    setDescStatus("saved");
  }, SAVE_DEBOUNCE_MS);

  function handleDescChange(value: string) {
    setDesc(value);
    if (!cardId) return;
    setDescStatus("pending");
    debouncedSaveDesc(cardId, value);
  }

  async function submitComment() {
    if (!cardId || commentText.trim().length === 0) return;
    setPosting(true);
    const res = await fetch(`/api/cards/${cardId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: commentText.trim() }),
    });
    setPosting(false);
    if (!res.ok) return;
    const { comment } = await res.json();
    setDetail((prev) => (prev ? { ...prev, comments: [comment, ...prev.comments] } : prev));
    setCommentText("");
  }

  async function archive() {
    if (!cardId) return;
    await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
    onArchived(cardId);
    onOpenChange(false);
  }

  return (
    <Sheet open={cardId !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {detail ? (
          <>
            <SheetHeader>
              <SheetTitle className="sr-only">{detail.card.name}</SheetTitle>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={saveName}
                className="h-auto border-none px-0 py-1 text-xl leading-normal font-semibold shadow-none focus-visible:ring-0"
              />
            </SheetHeader>

            <div className="flex flex-col gap-3 px-4 pb-4 text-sm">
              <div className="grid grid-cols-[100px_1fr] items-center gap-y-2">
                <span className="text-muted-foreground">Members</span>
                <MemberPicker
                  cardId={detail.card.id}
                  selected={detail.members}
                  options={boardMembers}
                  onChange={(next) => {
                    setDetail({ ...detail, members: next });
                    onMembersChanged(detail.card.id, next);
                  }}
                />

                <span className="text-muted-foreground">Created By</span>
                <div className="flex items-center gap-2">
                  {detail.creator ? (
                    <>
                      <MemberAvatar member={detail.creator} className="h-5 w-5" />
                      <span>{detail.creator.fullName}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Unknown</span>
                  )}
                </div>

                <span className="text-muted-foreground">Last Edited By</span>
                <div className="flex items-center gap-2">
                  {detail.lastEditor ? (
                    <>
                      <MemberAvatar member={detail.lastEditor} className="h-5 w-5" />
                      <span>{detail.lastEditor.fullName}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Unknown</span>
                  )}
                </div>

                <span className="text-muted-foreground">Status</span>
                <LabelPicker
                  cardId={detail.card.id}
                  selected={detail.card.labels}
                  options={boardLabels}
                  onChange={(next) => setDetail({ ...detail, card: { ...detail.card, labels: next } })}
                >
                  <div className="flex min-h-5 flex-wrap gap-1">
                    <StatusPills labels={detail.card.labels} />
                  </div>
                </LabelPicker>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Description</p>
                  {descStatus !== "idle" && (
                    <span className="text-xs text-muted-foreground">
                      {descStatus === "pending" ? "Saving…" : "Saved"}
                    </span>
                  )}
                </div>
                <MarkdownEditor value={desc} onChange={handleDescChange} placeholder="Add a description…" />
              </div>

              <CardAttachments cardId={detail.card.id} attachments={detail.attachments} />

              <Separator />

              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Comments</p>
                <div className="flex gap-2">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment…"
                    className="min-h-16 flex-1"
                  />
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    disabled={posting || commentText.trim().length === 0}
                    onClick={submitComment}
                  >
                    <HugeiconsIcon icon={SentIcon} size={16} />
                  </Button>
                </div>
                <div className="flex flex-col gap-3">
                  {detail.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <MemberAvatar member={comment.memberCreator} className="h-6 w-6 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {comment.memberCreator.fullName} · {new Date(comment.date).toLocaleString()}
                        </p>
                        <p>{comment.data.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <button
                type="button"
                onClick={archive}
                className="self-start text-sm text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
              >
                Archive card
              </button>
            </div>
          </>
        ) : (
          <div className="p-4 text-sm text-muted-foreground">Loading…</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
