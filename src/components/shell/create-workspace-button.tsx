"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function CreateWorkspaceButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [creating, setCreating] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    const res = await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), permissionLevel: visibility }),
    });
    setCreating(false);
    if (!res.ok) return;
    const { board } = await res.json();
    setOpen(false);
    setName("");
    router.push(`/b/${board.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent/60"
          />
        }
      >
        <HugeiconsIcon icon={Add01Icon} size={16} className="shrink-0" />
        New workspace
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="workspace-name">Name</Label>
            <Input
              id="workspace-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
              placeholder="My workspace"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Visibility</Label>
            <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as "private" | "public")}>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="private" id="visibility-private" className="mt-0.5" />
                <Label htmlFor="visibility-private" className="flex flex-col items-start gap-0.5 text-left font-normal">
                  <span className="font-medium">Private</span>
                  <span className="text-xs text-muted-foreground">Only you can see and edit this workspace.</span>
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="public" id="visibility-public" className="mt-0.5" />
                <Label htmlFor="visibility-public" className="flex flex-col items-start gap-0.5 text-left font-normal">
                  <span className="font-medium">Public</span>
                  <span className="text-xs text-muted-foreground">Anyone with the link can view it.</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={create} disabled={creating || !name.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
