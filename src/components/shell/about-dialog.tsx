"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const SOURCE_URL = "https://github.com/bikash1376/trition";

export function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" title="About Trition" />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>About Trition</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            A Notion-like workspace UI using Trello as a headless database. No custom database or backend infra
            required — all your notes, pages, and components are stored directly in Trello.
          </p>
          <p>
            <span className="font-medium text-foreground">Created by <a href="https://bikash.useiota.space">Bikash.</a></span>{" "}
            <a
              href={SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:text-foreground"
            >
              {SOURCE_URL.replace("https://", "")}
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
