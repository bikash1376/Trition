"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { HugeiconsIcon } from "@hugeicons/react";
import { Heading01Icon, TextBoldIcon, TextItalicIcon, TextStrikethroughIcon } from "@hugeicons/core-free-icons";
import { expandLoremAtCursor } from "@/lib/lorem";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
}

function resize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export function MarkdownEditor({ value, onChange, onBlur, placeholder, className }: MarkdownEditorProps) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  function wrapSelection(token: string) {
    const el = ref.current;
    if (!el) return;
    const { selectionStart, selectionEnd } = el;
    const before = value.slice(0, selectionStart);
    const selected = value.slice(selectionStart, selectionEnd) || "text";
    const after = value.slice(selectionEnd);

    // Toggle: if the selection is already wrapped in this token, remove it instead of nesting another layer
    const isWrapped = before.endsWith(token) && after.startsWith(token);
    if (isWrapped) {
      const newBefore = before.slice(0, before.length - token.length);
      const newAfter = after.slice(token.length);
      onChange(`${newBefore}${selected}${newAfter}`);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(newBefore.length, newBefore.length + selected.length);
      });
      return;
    }

    onChange(`${before}${token}${selected}${token}${after}`);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selectionStart + token.length, selectionStart + token.length + selected.length);
    });
  }

  function insertHeading() {
    const el = ref.current;
    if (!el) return;
    const lineStart = value.lastIndexOf("\n", el.selectionStart - 1) + 1;
    const restOfLine = value.slice(lineStart);

    // Toggle: strip the heading marker if the line already has one
    const hasHeading = restOfLine.startsWith("## ");
    onChange(
      hasHeading
        ? `${value.slice(0, lineStart)}${restOfLine.slice(3)}`
        : `${value.slice(0, lineStart)}## ${restOfLine}`,
    );
    requestAnimationFrame(() => el.focus());
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== " " && e.key !== "Tab") return;
    const el = e.currentTarget;
    const expanded = expandLoremAtCursor(el.value, el.selectionStart);
    if (!expanded) return;
    e.preventDefault();
    onChange(expanded.value);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(expanded.cursorPos, expanded.cursorPos);
      resize(el);
    });
  }

  if (!editing) {
    return (
      <div onClick={() => setEditing(true)} className={`min-h-6 cursor-text ${className ?? ""}`}>
        {value.trim() ? (
          <div className="prose-daspace">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{placeholder}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => wrapSelection("**")}
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <HugeiconsIcon icon={TextBoldIcon} size={13} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => wrapSelection("*")}
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <HugeiconsIcon icon={TextItalicIcon} size={13} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => wrapSelection("~~")}
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <HugeiconsIcon icon={TextStrikethroughIcon} size={13} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertHeading}
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <HugeiconsIcon icon={Heading01Icon} size={13} />
        </button>
      </div>
      <textarea
        ref={(el) => {
          ref.current = el;
          if (el) resize(el);
        }}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          resize(e.target);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          setEditing(false);
          onBlur?.();
        }}
        autoFocus
        placeholder={placeholder}
        rows={1}
        className={`resize-none overflow-hidden border-none bg-transparent text-sm leading-6 outline-none placeholder:text-muted-foreground ${className ?? ""}`}
      />
    </div>
  );
}
