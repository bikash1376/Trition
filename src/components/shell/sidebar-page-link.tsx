"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArtboardToolIcon, Delete02Icon, File01Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { NavLinkSpinner } from "@/components/shell/nav-link-spinner";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

interface SidebarPageLinkProps {
  href: string;
  listId: string;
  name: string;
  active: boolean;
  isCanvas?: boolean;
  onDeleted: (listId: string) => void;
  onRenamed: (listId: string, name: string) => void;
}

export function SidebarPageLink({ href, listId, name, active, isCanvas, onDeleted, onRenamed }: SidebarPageLinkProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirmOpen(true);
  }

  function handleDelete() {
    setDeleting(true);
    onDeleted(listId);
    if (active) {
      if (href.startsWith("/canvas")) {
        router.push("/home");
      } else {
        const pageHrefBase = href.slice(0, href.indexOf("/l/"));
        router.push(pageHrefBase || "/home");
      }
    }
    fetch(`/api/lists/${listId}`, { method: "DELETE" });
  }

  function handleEditClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setValue(name);
    setEditing(true);
  }

  function saveRename() {
    setEditing(false);
    const trimmed = value.trim();
    if (!trimmed || trimmed === name) {
      setValue(name);
      return;
    }
    onRenamed(listId, trimmed);
    fetch(`/api/lists/${listId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={saveRename}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setValue(name);
            setEditing(false);
          }
        }}
        className="w-full rounded-md border border-border bg-transparent px-2 py-1.5 text-sm outline-none"
      />
    );
  }

  return (
    <div
      className={`group flex items-center gap-1 rounded-md pr-1 text-sm ${
        active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60"
      }`}
    >
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5">
        <HugeiconsIcon icon={isCanvas ? ArtboardToolIcon : File01Icon} size={16} className="shrink-0" />
        <span className="truncate">{name}</span>
        <NavLinkSpinner />
      </Link>
      <button
        type="button"
        onClick={handleEditClick}
        className="shrink-0 cursor-pointer opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
      >
        <HugeiconsIcon icon={PencilEdit02Icon} size={13} className="text-muted-foreground hover:text-foreground" />
      </button>
      <button
        type="button"
        onClick={handleDeleteClick}
        disabled={deleting}
        className="shrink-0 cursor-pointer opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
      >
        <HugeiconsIcon icon={Delete02Icon} size={13} className="text-muted-foreground hover:text-destructive" />
      </button>
      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete "${name}"?`}
        description="This page and its content will be archived in Trello."
        onConfirm={handleDelete}
      />
    </div>
  );
}
