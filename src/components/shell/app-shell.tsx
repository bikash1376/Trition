"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { LayoutAlignRightIcon } from "@hugeicons/core-free-icons";

export function AppShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 overflow-hidden transition-all duration-200 md:static md:translate-x-0 ${
          open ? "translate-x-0 md:w-64" : "-translate-x-full md:w-0"
        }`}
      >
        <div className="h-full w-64">{sidebar}</div>
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden">
        <button
          type="button"
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          onClick={() => setOpen((v) => !v)}
          className="absolute top-3 left-3 z-20 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <HugeiconsIcon icon={LayoutAlignRightIcon} size={16} />
        </button>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
