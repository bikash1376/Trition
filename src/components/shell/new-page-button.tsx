"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function NewPageButton({ boardId, pageHrefBase }: { boardId: string; pageHrefBase: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    const res = await fetch(`/api/boards/${boardId}/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setCreating(false);
    if (!res.ok) return;
    const { list } = await res.json();
    setOpen(false);
    setName("");
    router.push(`${pageHrefBase}/l/${list.id}`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<button type="button" className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground" />}
      >
        <HugeiconsIcon icon={Add01Icon} size={11} />
        New
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New page</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-page-name">Name</Label>
          <Input
            id="new-page-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="Untitled"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button onClick={create} disabled={creating || !name.trim()}>
            Create page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
