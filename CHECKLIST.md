# DaSpace — CHECKLIST

Tracks current build phase. Update this file whenever a phase starts/finishes — don't let it go stale.

**Current phase: massive feature session — Home/Workspace sidebar restructure (backed by a real private Trello board), 5 block types (Text/Page/Table/Bookmark/Image), full table (sort/filter/inline editing), Markdown-based rich text, debounced writes + caching, workspace creation/invite UI, loading skeletons + nav spinners. `eslint` is clean; `next build`'s typecheck is currently unverifiable here because a concurrently-running `next dev` process corrupts `.next/dev/types` mid-write (not a code issue — see note below). Remaining: file/embed block, custom properties, deploy.**

**Build-verification note:** `next build`'s TypeScript pass reads `.next/dev/types/*`, which a live `next dev` process rewrites continuously. Running both at once corrupts those generated files (syntax errors in `routes.d.ts`/`validator.ts` that don't correspond to any source change). `eslint .` is unaffected and has been clean through this whole session. To get a real `next build` check, stop any running `next dev` first.

---

## Bugs found & fixed
- [x] `/login` was reachable while already authenticated (no redirect-away) — now redirects to `/` if a valid token cookie exists
- [x] Geist font wasn't rendering (fell back to serif) — `globals.css` had a circular `--font-sans: var(--font-sans)`; fixed to point at `--font-geist-sans`
- [x] OAuth `return_url` hardcoded to port 3000 collided with an unrelated project also on 3000 — DaSpace now runs on a dedicated port (3211 via `next dev -p 3211`), `NEXT_PUBLIC_APP_URL` updated to match

## Bugs & UX issues reported (2026-08-08 live testing, round 1) — all fixed
- [x] Images/video on cards didn't display — attachments fetched + rendered as real `<img>`/`<video>` via a same-origin proxy route (`/api/attachments/[cardId]/[attachmentId]`) that streams the file through with the Trello key/token server-side
- [x] Detail sheet "Archive card" — plain underlined text action, no button chrome
- [x] Status editor filters out Trello's default nameless color swatches (`label.name.trim().length > 0`)
- [x] Table row delete icon moved to a leftmost unlabeled column
- [x] Custom thin theme-matched scrollbar, applied globally
- [x] Detail sheet title input height bug fixed
- [x] Status editable inline in the table cell (`LabelPicker`), not just via the sheet
- [x] Bare-link cards open `target="_blank"` instead of the detail sheet
- [x] Member avatar hover card (name/username/avatar), using already-loaded data, no extra requests
- [x] Personal space vs. workspace — superseded by the full Home/Workspace restructure (round 4)

## Bugs & UX issues reported (round 2 — post block-canvas testing) — all fixed
- [x] Detail sheet description now editable (Markdown editor, debounced save)
- [x] Images still not showing — root cause was relying only on `attachment.mimeType` (often null from Trello); `src/lib/trello/media-type.ts` also checks file extension on `name`/`url`
- [x] `LabelPicker` popover anchored top-left instead of below the trigger — `className="contents"` removed the trigger's layout box; fixed to a real block-level trigger with `align="start"`
- [x] New cards default Created By to the current user optimistically, and auto-add the creator as a card member
- [x] Members cell has an always-visible "+" affordance (`MemberPicker`), no more bare "—"
- [x] Cursor now `pointer` globally on `button`/`[role=button]`/`summary` (Tailwind preflight was leaving it at `default`)
- [x] Delete/archive a page from the sidebar — `SidebarPageLink` hover-delete, `DELETE /api/lists/[listId]`
- [x] Personal space vs. workspace sidebar restructure — see Phase 6.5 below
- [x] Debounced writes — `useDebouncedCallback` (10s idle, flush on blur), with a "Saving…/Saved" indicator

## Bugs & UX issues reported (round 3) — all fixed
- [x] "Last edited by" — derived like Created By, but from the single most recent action of any type (no filter, `limit=1`). Scoped to the detail sheet only (on-demand), not the table, to avoid doubling per-row request cost
- [x] New pages default to a blank text-based canvas, not a table — `isCanvasList()` in `src/lib/trello/blocks.ts`: a list renders as a canvas if it's empty or every card carries a block marker, table otherwise. Table is now only reachable via explicit `/table`
- [x] Auto-linkify bare `https://` text — comes for free from `remark-gfm`'s autolink literals once Markdown rendering was added
- [x] Rich text formatting — Markdown-based editor (`src/components/markdown-editor.tsx`): toolbar for Bold/Italic/Strikethrough/Heading, `react-markdown` + `remark-gfm` for rendering, click-to-edit / blur-to-render. Underline intentionally excluded (not standard Markdown, Trello doesn't render it)
- [x] Status with no labels defaults to a neutral gray "Not started" pill (`StatusPills`), not an empty dash or a real label color
- [x] Sorting (click column header, cycles asc/desc) and filtering (Status + Members popover) added to the table toolbar

## Bugs & UX issues reported (round 4) — all fixed
- [x] `/page` / `/bookmark` composer had no way out once committed — Backspace on an empty pending-type input now cancels back to `"Type '/' for commands"` (Escape already worked; this covers the more natural "just backspace out" case)
- [x] Page titles (in both `BlockCanvas` and `CardTable`) are now editable — hover shows a text cursor, click to edit, blur saves via `PATCH /api/lists/[listId]`. Deliberately **not** editable for board-home/personal-home canvases, since those titles are shown from the Board name (or hardcoded "Home"), not the underlying `DaSpace` list name — editing that list's name would break the by-name lookup that finds it
- [x] Private boards show a lock icon in the sidebar's Workspaces list (`board.prefs.permissionLevel === "private"`, fetched via an extended `fields` param)
- [x] "+ New workspace" — `CreateWorkspaceButton`, a dialog with name + Private/Public visibility, right below Home in the sidebar, always visible
- [x] "+ New page" button in the sidebar's Pages section header (previously only reachable via `/page` inside a canvas)
- [x] "Invite" people to a workspace — button on the workspace-home canvas header, dialog collects an email, `PUT /1/boards/{id}/members` with `email`+`type=normal` (Trello's documented invite-by-email pattern — **not live-tested against the real API in this environment**, flag if it doesn't behave as expected)
- [x] Selecting **Bookmark** from `/` now also searches existing pages as you type (reusing the already-fetched page list) — picking one creates a client-routed internal page-link block instead of an external bookmark, so it never does a full reload

## Home/Workspace restructure (Phase 6.5) — done
- [x] Sidebar order: **Home** (top, always visible) → **Workspaces** (below)
- [x] Home is now backed by a genuinely separate, dedicated **private Trello board** (`PERSONAL_BOARD_NAME = "DaSpace Personal"`, `prefs_permissionLevel=private`), auto-created on first visit to `/home` — confirmed against the real Trello "Create board" dialog (`ref/create-board.png`), which is exactly Private/Workspace/Public
- [x] `/home` renders that personal board's own `DaSpace` list as a block canvas (same mechanism as a workspace home, just pointed at a different board) — full add/delete/edit for personal pages
- [x] While viewing Home, the sidebar's Pages section shows personal pages only, not any workspace's pages; the Workspaces list shows names only (collapsed) until you click into one
- [x] Clicking a workspace name still goes to that workspace's own home canvas (the original per-board `DaSpace` list), unchanged
- [x] `/` now always redirects straight to `/home` — no more "no boards found" dead end, since Home always exists regardless of workspace board count
- [x] Personal board filtered out of every "Workspaces" list rendering (`PERSONAL_BOARD_NAME` exclusion) so it doesn't show up as a pickable workspace

## Request-volume / rate-limit reduction
Trello's real limit: **100 requests / 10s per token** (~10/s sustained).
- [x] Server-side in-memory TTL cache (`src/lib/trello/cache.ts`) wraps `getMe`, `getMyBoards`, `getBoardMembers`, `getBoardLabels` (60s TTL) and `getCardCreator` (60min TTL — never changes once set)
- [x] Client-side `localStorage` cache (`src/lib/local-cache.ts`) for the detail sheet's board-labels fetch (10min TTL, per board)
- [ ] **Known limitation:** the server-side cache is per-process in-memory — fine for `next dev`/single-instance `next start`, won't be shared across multiple serverless instances (e.g. Vercel). Revisit before Phase 12
- [ ] Not cached (intentionally): `getBoardLists`, `getListCards`, per-card sheet data — all need to reflect changes immediately

## Phase 0 — Planning
- [x] Review all `/ref` screenshots (dashboard, sidebar, tables, trello board, login page, workspace page, sidebar-left, create-board)
- [x] Confirm Trello API is free + understand rate limits
- [x] `SPEC.md` v1 and v2
- [x] This `CHECKLIST.md`

## Phase 1 — Trello app credentials
- [x] API key created, dropped into `.env`
- [x] OAuth token flow (`response_type=token`), no client secret needed
- [x] `return_url` wired via `NEXT_PUBLIC_APP_URL`

## Phase 2 — Project scaffold
- [x] Next.js 16.3 (App Router), React 19.2, TypeScript, Tailwind v4
- [x] shadcn/ui: button, input, textarea, separator, avatar, scroll-area, sheet, popover, hover-card, skeleton, spinner, dialog, radio-group, label
- [x] Geist font, Notion-style theme tokens (dark/light + scrollbar tokens)
- [x] Hugeicons everywhere instead of lucide-react — swapped on sight in every shadcn component that shipped one

## Phase 3 — Auth
- [x] Login screen, Trello OAuth (live), Google (disabled), httpOnly cookie session, logout, 401-expiry handling

## Phase 4 — Onboarding & sidebar
- [x] Real boards fetched (owned + shared, one endpoint)
- [x] `/` → `/home` always (see Phase 6.5)
- [x] Sidebar: Home, Workspaces (with lock icons + nav spinners), Pages (with New/Delete)
- [x] "+ New Page" — both `/page` slash command and a direct sidebar button

## Phase 5 — Data model foundation
- [x] Block-type storage: hidden marker in `desc`, `src/lib/trello/blocks.ts`
- [x] Created By (long-cached) and Last Edited By (on-demand, sheet only)
- [x] Trello API client — boards, lists, cards, members, labels, attachments, comments, create/update/archive card & list, add/remove label & member, create board, invite member, upload attachment — with the caching layer for stable reads

## Phase 6 — Slash-command block editor
- [x] `/` menu: Text, Page, Table, Bookmark, Image — all five implemented and working
- [x] `/page` and `/table` → create a new list, insert a page/table-link block, shows up in the sidebar immediately
- [x] Page-link blocks render the *live* name of the list they reference
- [x] Text blocks: Markdown, debounced auto-save
- [x] Bookmark composer suggests existing internal pages, not just external URLs
- [x] Backspace-to-cancel out of a pending command
- [ ] **Still not covered:** in-place "/" editing on an *existing* block (menu only appears in the bottom composer, not mid-document); recursive canvases are decided by content heuristic (`isCanvasList`) rather than explicit user choice, which is simple but means a page that later gets a single "raw" Trello card flips to table view automatically — acceptable default, not configurable yet

## Phase 7 — Table block
- [x] Rows: Name, Status, Members, Created By — all with inline editing (Status via `LabelPicker`, Members via `MemberPicker`)
- [x] Add row, delete row (leftmost icon + sheet archive)
- [x] Sort (click header) and filter (Status + Members popover)
- [x] Editable page title
- [x] Row click → detail sheet (bare-link cards excepted)
- [x] Embeddable compact mode (`compact` prop) for the Table block type
- [ ] "+ Add a property" (Custom Fields: Text/Number/Date/Checkbox/Select) — not built

## Phase 8 — Card detail panel
- [x] Editable title, description (Markdown, debounced), Status, Members
- [x] Created By, Last Edited By (read-only)
- [x] Attachments (images/video inline, others as download links)
- [x] Comments feed
- [x] Archive action
- [ ] "+ Add a property" — depends on Phase 7's custom-fields work

## Phase 9 — Other block types
- [x] Bookmark — external link preview card, or internal page search-and-link
- [x] Image — real file upload to a Trello attachment, proxied render
- [x] Table — embedded compact live table, fetched client-side via `/api/lists/[listId]/table-data`
- [x] Text, Page — Phase 6
- [ ] Generic file/embed block (Google-Docs-style link preview with richer metadata than Bookmark) — not started

## Phase 10 — Workspace promotion & sharing
- [x] Create workspace with Private/Public visibility (`CreateWorkspaceButton`)
- [x] Invite people by email (`InviteButton`) — not live-verified against real Trello API
- [ ] "Turn a nested page into its own workspace" (the original SPEC §9 promotion flow, moving a List to a new Board) — not built; superseded in practice by the Home/Workspace model, but the literal promote-flow still doesn't exist
- [ ] Public share link surfacing (board is public, but no UI shows/copies the shareable URL)

## Phase 11 — Polish
- [ ] Theme toggle (dark is default and only mode wired up — light tokens exist, no UI switch)
- [x] Custom thin scrollbar, theme-matched, global
- [x] Loading states — route-level `loading.tsx` Skeleton shells for all four page routes, plus per-nav-item spinners via `useLinkStatus`
- [x] Rate-limit mitigation — two-layer caching (see above); still no explicit retry-on-429 handling if a burst does exceed the limit

## Phase 12 — Deploy
- [ ] Pick hosting (Vercel likely) — resolve the in-memory cache limitation first (see rate-limit section)
- [ ] Env vars for Trello API key in production
- [ ] Production OAuth return URL configured
