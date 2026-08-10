"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Heading01Icon,
  HighlighterIcon,
  TextBoldIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
  TextUnderlineIcon,
} from "@hugeicons/core-free-icons";
import { expandLoremAtCursor } from "@/lib/lorem";

// GFM has no native underline/highlight syntax, so those marks round-trip as raw
// <u>/<mark> tags via rehype-raw. Since this app supports public workspace
// sharing, raw HTML must be sanitized (not just passed through) to avoid a
// stored-XSS hole from arbitrary card content — only allowlist the two tags we
// actually emit, everything else keeps the library's default safe behavior.
const daspaceSanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "mark", "u"],
};

export interface MarkdownEditorHandle {
  /** Enters edit mode if needed, focuses the textarea, and places the caret. */
  focus(cursorPos?: number): void;
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  /** Return true if the caller handled it (e.g. merged into the previous block). */
  onBackspaceAtStart?: () => boolean;
  /** Fired on a 2nd Ctrl/Cmd+A press once this block's text is already fully selected. */
  onSelectAllEscalate?: () => void;
}

function resize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(function MarkdownEditor(
  { value, onChange, onBlur, placeholder, className, onBackspaceAtStart, onSelectAllEscalate },
  ref,
) {
  const [editing, setEditing] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingCaretRef = useRef<number | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      focus(cursorPos) {
        const pos = cursorPos ?? value.length;
        if (editing) {
          const el = textareaRef.current;
          el?.focus();
          el?.setSelectionRange(pos, pos);
          return;
        }
        pendingCaretRef.current = pos;
        setEditing(true);
      },
    }),
    [editing, value],
  );

  // The textarea doesn't exist until `editing` flips true and this re-renders,
  // so a pending caret request from `focus()` is applied here once it mounts.
  useEffect(() => {
    if (!editing || pendingCaretRef.current === null) return;
    const pos = pendingCaretRef.current;
    pendingCaretRef.current = null;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(pos, pos);
    resize(el);
  }, [editing]);

  function wrapSelection(open: string, close: string = open) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd } = el;
    const before = value.slice(0, selectionStart);
    const selected = value.slice(selectionStart, selectionEnd) || "text";
    const after = value.slice(selectionEnd);

    // Raw HTML tags don't reliably round-trip across a markdown paragraph break
    if (open.startsWith("<") && selected.includes("\n\n")) return;

    // Toggle: if the selection is already wrapped in this token, remove it instead of nesting another layer
    const isWrapped = before.endsWith(open) && after.startsWith(close);
    if (isWrapped) {
      const newBefore = before.slice(0, before.length - open.length);
      const newAfter = after.slice(close.length);
      onChange(`${newBefore}${selected}${newAfter}`);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(newBefore.length, newBefore.length + selected.length);
      });
      return;
    }

    onChange(`${before}${open}${selected}${close}${after}`);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selectionStart + open.length, selectionStart + open.length + selected.length);
    });
  }

  function insertHeading() {
    const el = textareaRef.current;
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
    const el = e.currentTarget;

    if ((e.key === "a" || e.key === "A") && (e.ctrlKey || e.metaKey)) {
      const alreadyFullySelected =
        el.value.length > 0 && el.selectionStart === 0 && el.selectionEnd === el.value.length;
      if (alreadyFullySelected && onSelectAllEscalate) {
        e.preventDefault();
        onSelectAllEscalate();
      }
      return;
    }

    if (e.key === "Backspace" && el.selectionStart === 0 && el.selectionEnd === 0 && onBackspaceAtStart) {
      if (onBackspaceAtStart()) e.preventDefault();
      return;
    }

    if (e.key !== " " && e.key !== "Tab") return;
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

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData("text/plain");
    if (!/\n{3,}/.test(text)) return;
    e.preventDefault();
    const el = e.currentTarget;
    const normalized = text.replace(/\n{3,}/g, "\n\n");
    const { selectionStart, selectionEnd } = el;
    const next = value.slice(0, selectionStart) + normalized + value.slice(selectionEnd);
    const caret = selectionStart + normalized.length;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
      resize(el);
    });
  }

  if (!editing) {
    return (
      <div onClick={() => setEditing(true)} className={`min-h-6 cursor-text ${className ?? ""}`}>
        {value.trim() ? (
          <div className="prose-daspace">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, [rehypeSanitize, daspaceSanitizeSchema]]}>
              {value}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{placeholder}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {hasSelection && (
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
            onClick={() => wrapSelection("<u>", "</u>")}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <HugeiconsIcon icon={TextUnderlineIcon} size={13} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => wrapSelection("<mark>", "</mark>")}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <HugeiconsIcon icon={HighlighterIcon} size={13} />
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
      )}
      <textarea
        ref={(el) => {
          textareaRef.current = el;
          if (el) resize(el);
        }}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          resize(e.target);
        }}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onSelect={(e) => setHasSelection(e.currentTarget.selectionStart !== e.currentTarget.selectionEnd)}
        onBlur={() => {
          setEditing(false);
          setHasSelection(false);
          onBlur?.();
        }}
        autoFocus
        placeholder={placeholder}
        rows={1}
        className={`resize-none overflow-hidden border-none bg-transparent text-sm leading-6 outline-none placeholder:text-muted-foreground ${className ?? ""}`}
      />
    </div>
  );
});
