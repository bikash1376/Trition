"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon, Settings02Icon, Sun03Icon, TerminalIcon, TestTube01Icon } from "@hugeicons/core-free-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";

export function SettingsDialog() {
  const { theme, setTheme } = useTheme();

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" title="Settings" />}>
        <HugeiconsIcon icon={Settings02Icon} size={16} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {/* <p className="font-label text-sm tracking-wide text-muted-foreground">Appearance</p> */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm">Theme</span>
            <div className="flex gap-1">
              <Button
                variant={theme === "light" ? "secondary" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={() => setTheme("light")}
              >
                <HugeiconsIcon icon={Sun03Icon} size={14} />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "secondary" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={() => setTheme("dark")}
              >
                <HugeiconsIcon icon={Moon02Icon} size={14} />
                Dark
              </Button>
              <Button
                variant={theme === "exp" ? "secondary" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={() => setTheme("exp")}
              >
                <HugeiconsIcon icon={TestTube01Icon} size={14} />
                Exp
              </Button>
              <Button
                variant={theme === "terminal" ? "secondary" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={() => setTheme("terminal")}
              >
                <HugeiconsIcon icon={TerminalIcon} size={14} />
                Terminal
              </Button>
            </div>
          </div>
          {/* <p className="text-xs text-muted-foreground">Saved on this device only — this isn&apos;t stored in Trello.</p> */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
