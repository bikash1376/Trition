"use client";

import { useState, type KeyboardEvent } from "react";

interface EditableTitleProps {
  listId: string;
  initialName: string;
  className?: string;
  onRenamed?: (name: string) => void;
}

export function EditableTitle({ listId, initialName, className, onRenamed }: EditableTitleProps) {
  const [name, setName] = useState(initialName);
  const [editing, setEditing] = useState(false);

  async function save() {
    setEditing(false);
    const trimmed = name.trim();
    if (!trimmed || trimmed === initialName) {
      setName(initialName);
      return;
    }
    await fetch(`/api/lists/${listId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    onRenamed?.(trimmed);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") e.currentTarget.blur();
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        className={`border-none bg-transparent outline-none ${className ?? ""}`}
      />
    );
  }

  return (
    <span onClick={() => setEditing(true)} className={`cursor-text ${className ?? ""}`}>
      {name}
    </span>
  );
}
