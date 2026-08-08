# DaSpace — CHECKLIST

Tracks current build phase. Update this file whenever a phase starts/finishes — don't let it go stale.

**Current phase: paused here at the user's request (stop point for a git commit). Session covered: Home/Workspace sidebar restructure + persistence-bug fix, 5 block types (Text/Page/Table/Bookmark/Image) now all editable/deletable via hover actions, full table (sort/filter/inline editing, single-select Status), Markdown rich text, debounced+optimistic writes, workspace creation/invite/settings UI, label management, loading skeletons + nav spinners. `eslint` is clean throughout; `next build`'s typecheck is unverifiable here while a concurrent `next dev` process is running (corrupts `.next/dev/types` mid-write — not a code issue, see note below). See "What's left" at the bottom for the honest remaining list.**

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

## Bugs & UX issues reported (round 5) — all fixed
- [x] **Optimistic UI everywhere a mutation doesn't need fresh Trello data to proceed** (navigation that needs a real id/route stays request-first, per explicit scoping): table add-card (temp row appended instantly, input never disabled, reconciled with the real card on response, rolled back on failure), table delete-card (already was optimistic), sheet title rename, sheet archive (closes/removes immediately), sheet comment submit (temp comment shown immediately using the logged-in user, reconciled on response), block composer text blocks (temp block appended instantly using the same block-marker serialization so it renders correctly right away, reconciled/rolled back on response) — composer input is never disabled while a request is in flight (previously blocked ALL typing during any create). Page/Table/Bookmark/Image block creation still wait for the real response before appearing, since they need a real list/attachment id to render anything meaningful — but they no longer block the composer input itself.

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
- [ ] "+ Add a property" (Custom Fields) — see Phase 13 below, doing now

## Phase 8 — Card detail panel
- [x] Editable title, description (Markdown, debounced), Status, Members
- [x] Created By, Last Edited By (read-only)
- [x] Attachments (images/video inline, others as download links)
- [x] Comments feed
- [x] Archive action
- [ ] "+ Add a property" — see Phase 13 below, doing now

## Phase 9 — Other block types
- [x] Bookmark — external link preview card, or internal page search-and-link
- [x] Image — real file upload to a Trello attachment, proxied render
- [x] Table — embedded compact live table, fetched client-side via `/api/lists/[listId]/table-data`
- [x] Text, Page — Phase 6
- [ ] Generic File block — see Phase 14 below, doing now

## Phase 10 — Workspace promotion & sharing
- [x] Create workspace with Private/Public visibility (`CreateWorkspaceButton`)
- [x] Invite people by email (`InviteButton`) — not live-verified against real Trello API
- [ ] "Turn a nested page into its own workspace" (the original SPEC §9 promotion flow, moving a List to a new Board) — not built; superseded in practice by the Home/Workspace model, but the literal promote-flow still doesn't exist
- [ ] Public share link surfacing (board is public, but no UI shows/copies the shareable URL) — doing now, Phase 14

## Phase 11 — Polish
- [ ] Theme toggle — doing now, Phase 14
- [x] Custom thin scrollbar, theme-matched, global
- [x] Loading states — route-level `loading.tsx` Skeleton shells for all four page routes, plus per-nav-item spinners via `useLinkStatus`
- [x] Rate-limit mitigation — two-layer caching (see above)
- [ ] Retry-on-429 handling — doing now, Phase 14

## Phase 12 — Deploy
- [ ] Pick hosting (Vercel likely) — resolve the in-memory cache limitation first (see rate-limit section)
- [ ] Env vars for Trello API key in production
- [ ] Production OAuth return URL configured
- [ ] See Phase 15 below for deploy-prep work being done now

## Phase 13 — Custom properties: ABANDONED, replaced by Phase 16
Trello's Custom Fields Power-Up **cannot be enabled through the API** (confirmed via Atlassian's official docs) — manual per-board web UI action required, which broke the "everything auto-provisions like lists/boards" pattern used everywhere else. **User decision: drop the Trello-native approach entirely** and build our own column system instead (Phase 16), reusing the same hidden-metadata-in-`desc` technique already proven for blocks. The dormant Trello-Custom-Fields plumbing (types, client functions, API routes, first-draft UI components) is being removed rather than left as unused dead code.

## Phase 14 — Remaining polish
- [ ] Generic **File** block: extend the Image block's upload mechanism to accept any file type (not just images), rendering by type (image/video inline, everything else as a file-icon + name + size download card) — no iframe embedding of external Google-Docs-style links, since reliably transforming arbitrary doc URLs into embeddable preview URLs isn't something to guess at; Bookmark already covers "paste an external doc link"
- [x] Rich text size — added H1/H2/H3 as distinct toolbar buttons in `MarkdownEditor` (previously only one flat heading level existed). This is the real, Trello-compatible answer to "bigger text" — arbitrary font size and text color are **not viable** (Trello's description renderer only supports standard Markdown, no inline size/color, and doesn't render embedded HTML/CSS) — confirmed to the user directly rather than faking it with something that'd only work in our own UI and desync from real Trello
- [ ] Theme toggle — light tokens already exist in `globals.css`, just needs a UI switch + persisted preference
- [ ] Retry-on-429 — wrap `trelloFetch` with a backoff retry when Trello returns 429
- [ ] Public share link surfacing — when a workspace board is public, show/copy its shareable URL somewhere in the UI

## Phase 15 — Deploy prep
- [ ] Can't actually deploy without the user's hosting account/credentials — scoping this to *preparation*: confirm build config is deploy-ready, document required production env vars, note the in-memory-cache-per-instance limitation clearly for whoever deploys
- [ ] `.env.local.example` reviewed and accurate for production use
- [ ] `NEXT_PUBLIC_APP_URL` / OAuth return URL behavior double-checked for a non-localhost deployment

## Phase 16 — Our own table columns (replaces Trello Custom Fields)
Same trick as blocks: a hidden marker as the first line of a card's `desc` (distinct prefix from the block marker so `isCanvasList()`'s detection is unaffected), just applied to table rows instead of canvas cards.
- [ ] Column *schema* storage: a special hidden card per list (not shown as a row) holding the column definitions as JSON — mirrors how the board's `DaSpace` list already acts as hidden-in-plain-sight infrastructure
- [ ] Column *value* storage: each row card gets a hidden `<!-- daspace:props={...} -->` marker prepended to its `desc`, ahead of the real description text
- [ ] Add / edit / delete columns from the table view — deleting always confirms via a modal first
- [ ] Column types: reuse the Text/Number/Date/Checkbox/Select set already designed (the UI from the abandoned Phase 13 attempt is largely reusable — same shapes, different storage backend)
- [ ] Rename columns
- [ ] Inline per-row editing, consistent with how Status/Members already work

## Phase 17 — Label management — done
Unlike Custom Fields, Trello Labels are fully API-manageable — no power-up, no manual-enable wall.
- [x] Rename a label (`PUT /1/labels/{id}`) — inline text input, blur to save
- [x] Change a label's color — swatch click opens a popover of the 10 Trello label colors
- [x] Delete a label (`DELETE /1/labels/{id}`) — inline confirm ("Delete X? Removes it from every card.") before it fires, same safety principle requested for columns
- [x] Create new labels for the board ("+ New label", starts unnamed + green, immediately editable)
- [x] Lives in the new **Board Settings** surface (Phase 19)

## Phase 18 — Sidebar & workspace UX fixes
- [x] "+ New Page" in the sidebar now opens a modal (`Dialog`, matching `CreateWorkspaceButton`'s pattern) instead of editing inline in place
- [x] Workspace home canvas header shows board members' avatars next to Invite — `WorkspaceMembers`, pulled from `GET /1/boards/{id}/memberships?member=true`, hover reveals each member's board role/"designation" (admin/normal/observer)

## Phase 20 — Sidebar persistence bug — fixed
Reported: clicking any sidebar page navigation caused the **entire UI including the sidebar** to vanish and get replaced by the loading skeleton. Root cause: no shared layout existed across `/home`, `/home/l/[listId]`, `/b/[boardId]`, `/b/[boardId]/l/[listId]` — each was an independent page that built its own `AppShell`+sidebar from scratch, so Next's route-level `loading.tsx` Suspense boundary replaced the *whole page*, sidebar included, on every navigation.
- [x] Route group `src/app/(app)/` created, `home` and `b` moved inside it (URLs unchanged — route groups don't affect the path) so they share one layout
- [x] `(app)/layout.tsx` — persistent shell: fetches `me`+`boards` once, renders `AppShell` with the sidebar, and `{children}` for whichever page is active. Doesn't remount on navigation between the four routes
- [x] Sidebar (`WorkspaceSidebarShell`) is now a client component reading the current pathname to derive active-board/active-list state and fetch just the contextual "Pages" list via two new endpoints (`GET /api/boards/[boardId]/pages`, `GET /api/home/pages`) — only that section shows a Skeleton while loading; logo/Home link/Workspaces list/user footer never do, since they come from the layout and don't refetch
- [x] Per-route `loading.tsx` trimmed to a content-area-only skeleton (`ContentSkeleton`, no sidebar shape anymore — the real sidebar stays mounted)
- [x] Old `WorkspaceSidebar` (server component, one-shot-per-page) deleted, fully replaced

## Phase 21 — Cover image for Home / workspace-home canvases — not started
Requested again — matches `ref/workspace-page.png` and `ref/dashboard-page.png`, which both show a banner cover image. Storage: a hidden marker card within the `DaSpace` list (same infra-card pattern as Phase 16's column schema), holding the cover image as a real Trello attachment — no separate list, and nothing that ever requires opening real Trello to configure.
- [ ] `isCoverCard(desc)` marker check in `src/lib/trello/blocks.ts`
- [ ] `BlockCanvas` extracts the cover card before rendering the normal block list, shows it as a full-width banner above the title
- [ ] "+ Add cover" hover affordance when none exists; upload via the same attachment mechanism as the Image block
- [ ] Way to remove/replace an existing cover

## Phase 19 — Board Settings surface — done
- [x] `BoardSettingsSheet` — gear icon, positioned exactly where requested: members → Invite → Settings, right side of the workspace home header
- [x] Right-side Sheet, currently hosts the Labels section; explicitly designed to grow ("More board settings will show up here over time" placeholder) as more Trello-API-backed admin features get added

## Phase 22 — Block hover actions + composer/editor fixes — done
Reported: non-text blocks (Page/Table/Bookmark/Image links) had **no way to edit or delete once created** — hovering did nothing.
- [x] `BlockHoverActions` — shared component, Hugeicons `PencilEdit02Icon`/`Delete02Icon`, wrapped in the new shadcn `Tooltip` (added `TooltipProvider` to the root layout)
- [x] `/api/blocks/[cardId]` extended: PATCH is now a generic read-modify-write for any block field (`type`/`ref`/`content`/`name`), not just text content; added DELETE (archives the card)
- [x] **Page block** — hover Edit renames the underlying list inline (`PATCH /api/lists/[listId]`); hover Delete unlinks it from this page (archives the block card, does **not** delete the referenced list itself — it stays reachable elsewhere)
- [x] **Table block** — hover Delete only; repositioned per follow-up feedback to live on the title row specifically (`CardTable` gained a `headerActions` slot), not as a floating overlay on the whole table
- [x] **Bookmark block** — hover Edit switches to an inline URL input, re-saves via the generic PATCH; hover Delete archives it
- [x] **Image block** — hover Delete archives it
- [x] **Text block** — hover Delete added (previously had inline edit but no way to remove it); also: if editing empties out all the text, the block now **auto-deletes on blur** instead of lingering as an empty placeholder
- [x] Block composer's default text-entry field is now a growing `<textarea>` instead of a single-line `<input>` — **Enter inserts a newline** (was previously impossible to write multi-line text), the block is created **on blur** instead of on Enter. Page/Table/Bookmark name-entry keeps the old single-line/Enter-submits behavior, since those are short names, not long-form content
- [x] Status (`LabelPicker`) is now genuinely **single-select** — picking a new status removes whatever was previously selected instead of accumulating multiple labels; clicking the current status again clears it back to "Not started"

## What's left (honest current state, 2026-08-08 end of session)
- **Our own table columns** (Phase 16) — biggest remaining item, not started. Add/edit/rename/delete custom columns using the same hidden-metadata-in-`desc` trick as blocks, replacing the abandoned Trello-Custom-Fields approach.
- **Cover image** (Phase 21) — not started, requested twice now.
- **Generic File block** (Phase 14) — any file type, not just images.
- **Smaller polish**: theme toggle, retry-on-429, public share-link surfacing, deploy prep.
- **Unverified against the real Trello API** (built from documented behavior, never seen live): the Invite-by-email endpoint (`PUT /1/boards/{id}/members`).
- **Known limitation**: server-side cache is per-process in-memory, won't share across multiple serverless instances if ever deployed somewhere like Vercel with multiple concurrent instances.
