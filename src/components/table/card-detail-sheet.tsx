"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, SentIcon } from "@hugeicons/core-free-icons";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MemberAvatar } from "@/components/table/avatar-stack";
import type { TrelloCard, TrelloCommentAction, TrelloMember } from "@/lib/trello/types";

interface CardDetail {
  card: TrelloCard;
  members: TrelloMember[];
  creator: TrelloMember | null;
  comments: TrelloCommentAction[];
}

interface CardDetailSheetProps {
  cardId: string | null;
  onOpenChange: (open: boolean) => void;
  onRenamed: (cardId: string, name: string) => void;
  onArchived: (cardId: string) => void;
}

export function CardDetailSheet({ cardId, onOpenChange, onRenamed, onArchived }: CardDetailSheetProps) {
  const [detail, setDetail] = useState<CardDetail | null>(null);
  const [name, setName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!cardId) return;

    let cancelled = false;
    fetch(`/api/cards/${cardId}`)
      .then((res) => res.json())
      .then((data: CardDetail) => {
        if (!cancelled) {
          setDetail(data);
          setName(data.card.name);
        }
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
                className="border-none px-0 text-xl font-semibold shadow-none focus-visible:ring-0"
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

                {detail.card.labels.length > 0 && (
                  <>
                    <span className="text-muted-foreground">Status</span>
                    <div className="flex flex-wrap gap-1">
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
                  </>
                )}
              </div>

              {detail.card.desc && (
                <p className="whitespace-pre-wrap text-muted-foreground">{detail.card.desc}</p>
              )}

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

              <Button variant="outline" size="sm" className="gap-2 self-start text-destructive" onClick={archive}>
                <HugeiconsIcon icon={Delete02Icon} size={16} />
                Archive card
              </Button>
            </div>
          </>
        ) : (
          <div className="p-4 text-sm text-muted-foreground">Loading…</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
