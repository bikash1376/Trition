"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserAdd01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function InviteButton({ boardId }: { boardId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function invite() {
    if (!email.trim()) return;
    setStatus("sending");
    const res = await fetch(`/api/boards/${boardId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    setStatus(res.ok ? "sent" : "error");
    if (res.ok) setEmail("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setStatus("idle");
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <HugeiconsIcon icon={UserAdd01Icon} size={14} />
        Invite
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite to this workspace</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && invite()}
            placeholder="teammate@example.com"
            autoFocus
          />
          {status === "sent" && <p className="text-xs text-muted-foreground">Invite sent.</p>}
          {status === "error" && <p className="text-xs text-destructive">Couldn&apos;t send that invite.</p>}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={invite} disabled={status === "sending" || !email.trim()}>
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
