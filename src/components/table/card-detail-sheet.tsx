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
import { readLocalCache, writeLocalCache } from "@/lib/local-cache";
import type { TrelloAttachment, TrelloCard, TrelloCommentAction, TrelloLabel, TrelloMember } from "@/lib/trello/types";

const BOARD_LABELS_TTL = 10 * 60_000;

interface CardDetail {
  card: TrelloCard;
  members: TrelloMember[];
  creator: TrelloMember | null;
  comments: TrelloCommentAction[];
  attachments: TrelloAttachment[];
}

interface CardDetailSheetProps {
  cardId: string | null;
  onOpenChange: (open: boolean) => void;
  onRenamed: (cardId: string, name: string) => void;
  onArchived: (cardId: string) => void;
}

export function CardDetailSheet({ cardId, onOpenChange, onRenamed, onArchived }: CardDetailSheetProps) {
  const [detail, setDetail] = useState<CardDetail | null>(null);
  const [boardLabels, setBoardLabels] = useState<TrelloLabel[]>([]);
  const [name, setName] = useState("");
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
                <div className="flex -space-x-1.5">
                  {detail.members.length === 0 && <span className="text-muted-foreground">Empty</span>}
                  {detail.members.map((m) => (
                    <MemberAvatar key={m.id} member={m} className="h-6 w-6 border-2 border-background" />
                  ))}
                </div>

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

                <span className="text-muted-foreground">Status</span>
                <LabelPicker
                  cardId={detail.card.id}
                  selected={detail.card.labels}
                  options={boardLabels}
                  onChange={(next) => setDetail({ ...detail, card: { ...detail.card, labels: next } })}
                >
                  <div className="flex min-h-5 flex-wrap gap-1">
                    {detail.card.labels.length === 0 && <span className="text-muted-foreground">Empty</span>}
                    {detail.card.labels.map((label) => (
                      <span
                        key={label.id}
                        className="rounded px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: label.color ?? "#8c9bab" }}
                      >
                        {label.name || label.color}
                      </span>
                    ))}
                  </div>
                </LabelPicker>
              </div>

              {detail.card.desc && (
                <p className="whitespace-pre-wrap text-muted-foreground">{detail.card.desc}</p>
              )}

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
