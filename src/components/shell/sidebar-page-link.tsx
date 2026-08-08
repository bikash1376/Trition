"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, File01Icon } from "@hugeicons/core-free-icons";
import { NavLinkSpinner } from "@/components/shell/nav-link-spinner";

interface SidebarPageLinkProps {
  href: string;
  listId: string;
  name: string;
  active: boolean;
}

export function SidebarPageLink({ href, listId, name, active }: SidebarPageLinkProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);
    await fetch(`/api/lists/${listId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div
      className={`group flex items-center gap-1 rounded-md pr-1 text-sm ${
        active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60"
      }`}
    >
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5">
        <HugeiconsIcon icon={File01Icon} size={16} className="shrink-0" />
        <span className="truncate">{name}</span>
        <NavLinkSpinner />
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="shrink-0 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
      >
        <HugeiconsIcon icon={Delete02Icon} size={13} className="text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
}
