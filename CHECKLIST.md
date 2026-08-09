# Trition — CHECKLIST

Tracks current build phase. Update this file whenever a phase starts/finishes — don't let it go stale.

**Current phase: added a "Try now" demo login — a shared throwaway Trello account, gated behind an env var, that periodically wipes itself after an hour of inactivity via a sweep-on-click (no cron dependency). Also: login page background pinned to `#181818` regardless of theme; Google login button (never implemented, no plans to) replaced by the demo button entirely. See Phase 36.**

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

## Phase 16 — Our own table columns (replaces Trello Custom Fields) — done
Same trick as blocks: a hidden marker prepended to a row card's `desc`, distinct from the block marker so nothing else that reads `desc` gets confused — see Phase 29 for the finished implementation.

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

## Phase 21 — Cover image for workspace-home canvases — done
Storage: a hidden marker card (`__daspace_cover__`) in the `DaSpace` home list, `desc` holds the real Trello attachment id — same infra-card pattern used elsewhere, nothing that ever requires opening real Trello to configure.
- [x] `COVER_CARD_NAME` sentinel in `src/lib/trello/blocks.ts`; the two workspace-home routes (`/b/[boardId]`, and personal `/home` intentionally excluded — see below) filter it out of the normal card list before handing cards to `BlockCanvas`
- [x] `POST`/`DELETE /api/boards/[boardId]/cover` — upload replaces any existing attachment on the marker card (old one explicitly deleted first via new `deleteCardAttachment`), delete archives the marker card
- [x] `BlockCanvas` renders the cover as a full-bleed banner above the title when present
- [x] Management lives only in **Board Settings** (per explicit confirmation — no inline "+Add cover" hover affordance on the canvas itself): thumbnail + Remove button when set, "Add cover image" button when not, remove goes through the same confirm-dialog pattern as every other delete
- Personal `/home` doesn't get Board Settings at all (no invite/labels there either — single-user board), so cover support was scoped to real shared board-workspaces only, consistent with that existing boundary

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

## Phase 23 — Vercel build fix + sidebar toggle + attachment proxy resilience — done
- [x] Fixed the actual production build break: `TooltipProvider` (Base UI, not Radix) takes `delay`, not `delayDuration`. Only caught by Vercel's clean build — local checks had been silently reading a stale `.next/types` cache left over from before the `(app)` route-group move, which masked this. Cleared it and re-verified with a clean `tsc --noEmit` + `eslint`, both clean, before pushing the fix
- [x] `AppShell` rewritten as a client component with one shared `open` boolean driving both behaviors requested: a mobile off-canvas drawer (backdrop click closes it) and a desktop collapse/expand (sidebar width animates to 0 instead of just sliding off-screen, reclaiming the space). Single persistent toggle button, top-left of the content area, `HugeiconsIcon` `LayoutAlignRightIcon` per direct request
- [x] Attachment proxy (`/api/attachments/[cardId]/[attachmentId]`) now falls back to the bare attachment URL if the key/token-appended request fails — researched Trello's actual auth behavior first (confirmed query-param `?key=&token=` is a valid, commonly-used pattern), but some attachment URLs may already be pre-signed (e.g. S3), where appending extra query params would invalidate the signature. The fallback covers both cases without needing to know which kind of URL Trello handed back. **Not yet live-verified** — flag if images/video are still broken after this
- [ ] Broader mobile responsiveness pass (table/canvas padding, wrapping toolbars, etc.) beyond the sidebar toggle — explicitly deferred, user said "that's it for now"

## Phase 24 — Lorem ipsum expansion shortcut — done
- [x] `src/lib/lorem.ts` — `generateLorem(n)` (word bank, cycles/repeats past 60, capitalizes + periods), `expandLoremAtCursor(value, cursorPos)` (pure function: matches a `loremN` token immediately before the cursor, returns the replacement + where the cursor should land, or `null` if no match)
- [x] Trigger: type `lorem22` then press **Space** or **Tab** → expands to 22 words in place, cursor lands right after. Chose word-count over character-count (ambiguous in the request) since it's the standard convention for this shortcut elsewhere and gives more predictable-looking output
- [x] Wired into both places text gets typed: `MarkdownEditor` (covers canvas text blocks *and* the card detail sheet's description — same shared component) and the block composer's default text-entry textarea (covers creating a brand-new text block from `/` or plain typing)

## Phase 25 — Root-cause image fix, confirm-before-delete, table polish, unified pages, lorem block, cover image — done
Reported after Phase 23's fallback attempt still didn't fix broken images live: "i added an image i could see it in trello but in our app it shows the broken image and the image file name."
- [x] **Real root cause found**: Trello's attachment `/download/` route rejects query-param `?key=&token=` auth outright — it needs to be sent as an `Authorization: OAuth oauth_consumer_key="…", oauth_token="…"` header, and the correct download URL is `https://api.trello.com/1/cards/{cardId}/attachments/{attachmentId}/download/{fileName}`, not the raw `attachment.url`. `/api/attachments/[cardId]/[attachmentId]` rewritten around this (researched via Trello's developer community before changing anything); bare `attachment.url` kept as a last-resort fallback for link-style attachments. Also added `onError` fallback UI in `ImageBlock` and `CardAttachments` so a still-failing load degrades to a small icon+filename instead of the browser's bare broken-image glyph
- [x] **Confirm-before-delete everywhere**: new shared `ConfirmDeleteDialog` (real modal, not inline); wired into every delete path that didn't already have one — `PageBlock`, `BookmarkBlock`, `TextBlock`, `ImageBlock`, `TableBlock`, `CardTable` row delete, `SidebarPageLink`, and `CardDetailSheet`'s "Archive card". `LabelManagerRow`'s existing inline confirm-row was left as-is (already confirms, just a different UI shape that fits its layout better)
- [x] **Table header repositioning**: `CardTable`'s Filter button and the table-block delete icon (`headerActions`) both moved to the far right of the header row, delete after Filter; Filter is now hidden entirely when the table has zero rows
- [x] **Skeleton loaders for async block creation**: Table and Bookmark blocks show an optimistic skeleton placeholder the moment they're submitted from the composer, swapped for the real block on response (`BlockComposer` gained `onPending`/`onPendingResolved`, mirroring the existing temp-id pattern already used for text blocks)
- [x] **Every page is now open to add anything**: retired the binary "a list is either a canvas or a table" (`isCanvasList`) split. Both list-page routes now always split a list's cards into table rows (no block marker) vs. blocks (has a marker) and hand both to `BlockCanvas`, which renders an optional table section (`CardTable` with a new `showTitle={false}` mode) above the usual block list, with the composer always available underneath — so pages that started as real pre-existing Trello lists can now mix table rows with free-form blocks, and there's always a way to click below a table and type. This should also resolve the reported "no delete icon on hover for tables from existing lists" — that table now renders through the exact same `CardTable` code path as every other table, there's no longer a separate branch that could behave differently
- [x] **Lorem reworked into a slash command**: `/lorem` now appears in the composer's `/` menu (`AiMagicIcon`); selecting it prompts "How many words?" the same way Page/Table do; typing `/lorem25` + Enter generates directly without opening the menu at all. The old inline `loremN`+Space/Tab trigger was removed from the block composer (replaced by the slash command) but left in place in `MarkdownEditor` for expanding lorem text while editing an existing block's body — a different, still-useful scenario
- [x] **Cover image** — see Phase 21 above, now done

## Phase 26 — Rebrand to Trition (login video intro, dashboard wordmark) — done
- [x] Added Google Font **Yesteryear** (`next/font/google`), exposed as the `font-script` Tailwind utility (`--font-script` in `globals.css`'s `@theme inline`, mapped from the `--font-yesteryear` variable set on `<html>` in `layout.tsx`)
- [x] `src/components/login-hero.tsx` (new) — login page intro sequence using `public/trition-write-main.mp4`: video autoplays large (`h-[min(80vh,1200px)]`), shrinks to `h-96 w-96` on end, settles with a small `translate-y-5` nudge, then on the *next* transition end swaps instantly (no transition/duration classes on that last step, so it's a silent, unanimated snap) to the "Trition" wordmark in Yesteryear, white with a `1.6px` `-webkit-text-stroke`, `self-end`-aligned in the same box so it lands exactly where the video stopped. The tagline + Trello/Google login buttons fade in (`transition-opacity`) once settled. Went through several rounds of live tuning (box sizes, translate amounts, removing/re-adding transition classes) — this is the settled version
- [x] Removed the blue gradient `DaSpaceMark` box from the login page entirely (kept on the sidebar brand, not asked to remove there)
- [x] `src/app/auth/trello/callback/page.tsx` — the post-OAuth "setting up" screen originally played the same `trition-write-main.mp4`; **superseded in Phase 27** by a Progress bar instead (see below)
- [x] Sidebar brand (`WorkspaceSidebarShell`) — "DaSpace" text swapped for "Trition" set in `font-script`
- [x] Every page already gets the same centered/sidebar-offset treatment as the workspace home pages — this fell out of Phase 25's page-unification work for free, since every route now renders through `BlockCanvas`'s `mx-auto max-w-3xl px-10 py-12` wrapper; no standalone un-padded `CardTable` route remains
- Internal `HOME_LIST_NAME = "DaSpace"` constant in `src/lib/trello/blocks.ts` intentionally left unchanged — it's the literal Trello list name the app matches on, renaming it would orphan already-created lists; this rebrand is display-only

## Phase 27 — Setup progress bar + sidebar/dialog/comment layout fixes — done
- [x] **Post-auth "setting up" screen**: video replaced with a real Progress bar. Added `src/components/ui/progress.tsx` (Base UI `@base-ui/react/progress`, matching the existing shadcn/Base UI component pattern already used for Dialog/RadioGroup/etc. — this project has no shadcn CLI wired up, so it was hand-written directly from Base UI's primitives). Progress fills smoothly toward 96% over a 3.5s minimum window, then snaps to 100% only once both that timer *and* the real session-POST have resolved, before redirecting — so it never visually completes before the real work is actually done, and never redirects before at least ~3.5s have shown
- [x] **Sidebar brand**: blue `DaSpaceMark` box removed (this time from the sidebar too, not just login), "Trition" text bumped `text-lg` → `text-2xl`, and given a `.brand-shimmer` hover effect (`currentColor`-based gradient sweep via `background-clip:text`, defined in `globals.css`) so it reads correctly in both themes without a hardcoded color
- [x] **"+ New workspace" trigger**: was rendering through the shared `Button` component (`size="sm"`, different height/padding/icon-size/font-size than the `Home` link right above it); rewritten as a plain `<button>` with the exact same classes as the `Home` `<Link>` so the two rows align pixel-for-pixel
- [x] **Board list icons**: `Building03Icon` (+ a separate small lock badge for private boards) replaced with a single icon per row driven by `board.prefs?.permissionLevel` — `CorporateIcon` for `"org"` (shared/organization workspaces), `UserLock01Icon` for `"private"`/`"public"`
- [x] **Create Workspace modal radio text alignment** (`ref/text-alignment.png`) — root cause: the shared `Label` component's base classes include `flex items-center` (a row-flex default); `CreateWorkspaceButton` overrode it to `flex flex-col` for the two-line Private/Public labels but never overrode `items-center`, so in a column flex that centers children on the *cross* axis — i.e. horizontally. Fixed by adding `items-start text-left` to both labels
- [x] **"+ New" under Pages** — dropped the "New" text label, kept just the icon, bumped `size={11}` → `size={14}`
- [x] **Empty pages state** — "No personal pages yet." / "No pages on this board yet." text replaced with a centered `Archive04Icon`, same icon for both contexts
- [x] **Comment composer send button** (`CardDetailSheet`) — the icon button next to the tall `Textarea` was flex-default top-aligned; added `items-end` to the row so it sits at the textarea's bottom instead

## Phase 28 — Table/cover width & height, markdown toggle fix, table column polish, another sidebar pass — done
- [x] **Table pages break out wider than regular blocks**: `BlockCanvas` restructured — the outer scroll container is now `max-w-5xl` (was `max-w-3xl` for everything), with the title row, block list, and composer each individually wrapped back down to `max-w-3xl` so they're unchanged, while the table section alone uses the full `max-w-5xl` width. Same left edge as the rest of the content, meaningfully more room on the right. `CardTable`'s own `overflow-x-auto` wrapper (already existed) still kicks in beyond that for genuinely wide tables — just the table scrolls, nothing else on the page does
- [x] **Cover image full-width + configurable height**: cover now renders *outside* the `max-w-5xl` content wrapper entirely, so it's truly edge-to-edge of the content area (not just bleeding past the old `px-10`). Height is now user-configurable — 25% / 40% / 50% of viewport height, picked via new buttons in Board Settings under the cover thumbnail. Storage: the cover marker card's `desc` changed from a bare attachment id to `"{attachmentId}|{heightPercent}"`; the cover API route gained a `PATCH` handler (updates just the height, keeps the existing attachment) alongside the existing `POST`/`DELETE`
- [x] **Markdown toolbar bold/italic/strikethrough/heading now toggle off**: root cause was `wrapSelection`/`insertHeading` in `MarkdownEditor` always inserting the token, never checking whether the selection was already wrapped. Fixed — both now detect the existing marker (`before.endsWith(token) && after.startsWith(token)` for wrap-tokens, `line.startsWith("## ")` for heading) and strip it on a repeat click instead of nesting another layer
- [x] **Table Status column**: pills/`"Not started"` text now `whitespace-nowrap`, column given `w-48` so labels like "In progress" render on one line instead of wrapping
- [x] **Table Created By column**: now shows the creator's avatar (`MemberAvatar`, reused from the existing avatar-stack component) plus first name only (`fullName.split(" ")[0]`), instead of a bare full-name text string
- [x] **Re-verified status is still single-select**: re-read `LabelPicker.toggle()` — picking a new status still explicitly clears every previously-selected label before applying the new one, and clicking the current status again clears it back to "Not started." Confirmed the Phase 22 fix is still correct and unregressed; no code change needed here
- [x] **Sidebar, another pass**: all `<Separator>` elements removed (between brand/Home, Home/Workspaces, Workspaces/Pages, Pages/user-footer) — active/hover states on links themselves untouched; bottom row rebuilt as just the user's name with the logout icon button on the right (avatar circle and "Log out" text dropped) with no border above it; empty-pages state now sits inside a `flex-1` region so it's centered in the Pages section's actual available space instead of a cramped `py-4` row
- [x] **Shimmer visibility fix**: the `currentColor`-based sweep from Phase 27 was nearly invisible in dark mode because the base sidebar text color (`#d4d4d4`) is already close to white, so mixing it with white barely changed anything. Switched the gradient's highlight stop to `var(--primary)` (the theme's blue accent) instead — a real color sweep now, not just a brightness shift — and fixed the resting `background-position` to match the animation's start frame so there's no jump when hover begins. Verified the animation/gradient mechanism directly via a live browser session (forced the keyframe, confirmed `background-clip:text` and the gradient were computing correctly) since this environment's synthetic mouse events don't trigger real CSS `:hover`
- Noted, not built: **custom-columns UX idea** — hovering the table (or a column header) to surface an add/edit/remove tooltip/popover, for whenever Phase 16 (custom columns) actually gets built
- Considered, not added: **"Last Edited By" column** — would mirror the existing Created By column, but doing it as a first-class table column means fetching the last editor for every row on load (same N+1 pattern already used for Created By), which is a real per-row API cost on top of what's already there. Better suited as an opt-in custom column (Phase 16) than a column everyone pays for by default — flagging the tradeoff rather than guessing
- Not attempted this round: "add more blocks / more workspace settings if you think you can" — the explicit list above was already large; happy to take a pass at new block types (e.g. divider, checklist/todo) or additional settings as a follow-up if wanted

## Phase 29 — Custom table columns (Phase 16, finally built) — done
Same trick as blocks: a hidden marker, but two different kinds of hidden storage needed here — one per-list (the column definitions) and one per-row (each row's values).
- [x] **Schema storage**: `src/lib/trello/columns.ts` — a hidden card per list, `__daspace_columns__` (same sentinel-card pattern as the cover marker), `desc` holds the column list as plain JSON (`ColumnDef[]`: id/name/type/options). Filtered out of `tableCards` alongside the cover/block markers in both unified page routes and `table-data/route.ts`, so it never shows up as a row
- [x] **Value storage**: each row's `desc` gets `<!-- daspace:props={base64 JSON} -->` prepended ahead of the real description text — base64'd (not just URL-encoded) specifically so a value containing the literal substring `-->` can't ever prematurely close the HTML comment
- [x] **Description stays clean everywhere it's read/written**: `GET /api/cards/[cardId]` now strips the props marker before returning `desc`; `PATCH` reads the *current* props first and re-merges them into whatever new `desc` is being saved, so editing a card's description can never silently wipe its column values. Verified live: set a description after already setting a column value, confirmed both the description came back clean and the column value survived
- [x] **Column CRUD**: `POST/GET /api/lists/[listId]/columns`, `PATCH/DELETE /api/lists/[listId]/columns/[columnId]` — add, rename, delete, and (for select columns) manage the option list, all via `ColumnHeaderMenu` (hover-to-edit on the column header, matches the block hover-actions pattern) and `AddColumnButton` (a trailing `+` header cell), delete always behind the existing `ConfirmDeleteDialog`
- [x] **Column types**: Text, Number, Date (native `<input type="date">`, no custom calendar built), Checkbox, Select (colored pills reusing the existing Trello label-color palette, single-select with a Clear option) — `CustomCell` renders/edits per type inline, same click-to-edit convention as the rest of the table
- [x] **Per-row value storage**: `PATCH /api/cards/[cardId]/props` updates one column's value on one row, preserving the rest of that row's props and its real description
- [x] Wired into all three places a table can render: the two unified page routes (server-fetched, passed as `tableColumns`) and `TableBlock`'s own `table-data` fetch (client-side, embedded named tables)
- Scoped out deliberately: sorting and filtering only cover the four built-in columns — custom columns aren't sortable/filterable yet. Deleting a column doesn't sweep its now-orphaned value out of every row's `props` (cheap to skip since it's simply ignored once the column is gone; not worth an extra per-row API call on every delete)
- Verified end-to-end in a live logged-in session (not just typecheck/lint): created a "Priority" select column, added High/Low options, set a row to "High," confirmed the pill rendered, confirmed the value survived an unrelated description edit, and confirmed the card detail sheet's description field showed no leaked marker text

## Phase 30 — Sidebar: real shimmer component, clickable empty state, spacing — done
- [x] **Shimmer swapped to the Better Component**: `src/components/better/text-shimmer.tsx` (framer-motion, `motion/react`) now drives the "Trition" wordmark instead of the earlier hand-rolled `.brand-shimmer` CSS class, which was deleted from `globals.css`. The component's own dark-mode default (`--base-gradient-color: neutral-900`, i.e. the sweep rendering *black* against dark text — invisible/wrong) was the actual bug; fixed by changing that one variable to `neutral-50` (white) directly in the component file. `--base-color` (the resting text color, `neutral-400`) was already the grayish tone asked for — left as-is
- [x] **Empty-pages state is now the "add page" affordance**: `NewPageButton` gained an optional `trigger`/`children` pair (mirrors the existing `DialogTrigger render=` convention used elsewhere) so its dialog can be opened from a custom trigger instead of its default small button. The empty state (Archive icon + "Create New" text, `pages.lists.length === 0`) now *is* that custom trigger; the separate `+` that used to sit next to the "Pages" section header is gone — verified live that clicking "Create New" opens the same "New page" modal
- [x] **Sidebar spacing increased**: brand row and bottom user row `py-3` → `py-4`; each section's own padding `py-2` → `py-3`; nav-list item gaps `gap-0.5` → `gap-1`; section label bottom padding `pb-1` → `pb-1.5` — more breathing room throughout, matching the reference (`ref/spacing.png`)

## Phase 31 — Mobile reachability, lobby activity, default Last-Edited column, workspace settings, rebrand finish, README — done
Requested: audit mobile responsiveness (block/column edit-delete wasn't reachable on touch), confirm column rename/add/delete already exist, finish the Trition rebrand everywhere it's *displayed* (keep `DaSpace` only as the internal list-name constant), a workspace-top "In lobby" button showing who last edited what, a default "Last Edited By" table column, sidebar corner radius, an About dialog, more Notion-style workspace settings, and an updated README.

- [x] **Column rename/add/delete/reorder-options — confirmed already built** (Phase 29: `ColumnHeaderMenu`, `AddColumnButton`). No gap here; only the mobile-hover issue below applied to it.
- [x] **Mobile reachability root-cause fix**: every "hover-to-reveal" action was `opacity-0` + `group-hover:opacity-100`, which touch devices can never trigger (no `:hover`). Changed to `opacity-100 md:opacity-0 md:group-hover:opacity-100` (visible unconditionally below the `md` breakpoint, hover-gated only on pointer devices) in `BlockHoverActions` (block edit/delete), `CardTable` (row delete), `ColumnHeaderMenu` (column rename/delete), `SidebarPageLink` (page delete), and `TableBlock` (table delete)
- [x] **Responsive padding pass**: `BlockCanvas` and `CardTable` (non-compact) step padding down on small screens (`px-4 py-6/8` → `sm:px-8/10 sm:py-8/12`); both header rows (`BlockCanvas` title/actions, `CardTable` title/filter) now `flex-wrap` instead of forcing a single row that could overflow narrow viewports
- [x] **Rebrand finished**: `<title>` metadata, the Trello OAuth consent screen's app name (`name` param in `/api/auth/trello/authorize`), `package.json`'s `name`, and this README all say Trition now. `HOME_LIST_NAME`/`PERSONAL_BOARD_NAME` (`src/lib/trello/blocks.ts`) and the `daspace:*` hidden-marker prefixes are deliberately left alone — renaming the literal Trello list name would orphan every already-created list, and the marker prefix is an internal wire format, never rendered
- [x] **"In lobby" activity button**: new `LobbyButton` (`src/components/shell/lobby-button.tsx`), placed first in the workspace-home header's action row (left of Members/Invite/Settings). Backed by `getBoardActions` (`src/lib/trello/client.ts`, `GET /1/boards/{id}/actions`, 15s cache) and `GET /api/boards/[boardId]/activity`, which filters out the app's own sentinel cards (cover/columns/settings) and maps each action to "who · did what · which page" (page = the Trello list name, matching this app's Page↔List mapping) with relative timestamps. Scoped to real board workspaces only (same boundary as Invite/Settings/Labels) — personal `/home` has no board-wide "who else" concept
- [x] **Default "Last Edited By" table column**: `CardTable` gained a fifth built-in column (mirrors "Created By": avatar + first name, sortable). Backed by the already-existing `getCardLastEditor` (now TTL-cached like the other per-card reads) fetched N+1 alongside `getCardCreator` in both page routes and `table-data/route.ts`. This reverses the Phase 28 "considered, not added" call — now built, but see the cost mitigation below
- [x] **Cost mitigation for the above**: a per-workspace toggle (**Board Settings → App settings → "Show Last Edited By column"**, default on) lets a workspace opt out of the extra per-row Trello Actions calls on large tables. Stored as a hidden marker on the **board's own `desc` field** (`src/lib/trello/board-settings.ts`, new — same base64-JSON-in-HTML-comment technique as block/column/props markers, just at board scope instead of card scope since it's workspace-wide). Personal `/home` tables have no settings UI, so they always fetch it (no toggle to gate on)
- [x] **Expanded Board Settings**: new "General (compatible with Trello)" section — Visibility (Private/Public, `prefs_permissionLevel`), Who can comment (`prefs_comments`: Off/Members/Workspace/Anyone), Card covers on/off (`prefs_cardCovers`), "Anyone in workspace can join" (`prefs_selfJoin`) — all real Trello board prefs, updated via a new `updateBoard()` PUT and the new `GET/PATCH /api/boards/[boardId]/settings` route. Plus the app-only "Show Last Edited By column" toggle from above under a separate "App settings (Trition)" section
- [x] **Sidebar corner radius**: `<aside>` gets `rounded-r-[12px] overflow-hidden` (the requested ~12px radius on the sidebar's right edge)
- [x] **About dialog**: `AboutDialog` (3-dot `MoreHorizontalIcon`, Hugeicons), sits in the sidebar footer row just left of the logout button. Describes the project (Notion-like UI, no app database, everything's a real Trello object) and credits "Created by Bikash" with a link to `github.com/bikash1376/trotion`
- [x] **README rewritten** to match the actual current architecture (the old one predated the `(app)` route-group restructure, custom columns, and the rebrand) — stack, routing, the Notion↔Trello concept mapping table, project layout, mobile notes, and the rate-limit/cost tradeoffs including the new Last-Edited-column toggle
- Not live-verified (same caveat as prior phases — flag if wrong once tested against real Trello): the `prefs_comments`/`prefs_selfJoin`/`prefs_cardCovers` PUT param names on `/1/boards/{id}`, and the board actions filter/shape returned by `/1/boards/{id}/actions`

## Phase 32 — Theme switcher, light-mode pink palette, card-detail-sheet spacing — done
Requested: a user-level (not workspace-level) theme switcher — dark mode already existed, light mode needed real colors instead of the old grayscale Notion palette; a specific pink brand palette for light mode (sidebar, buttons, borders); and a spacing/alignment cleanup of the card detail sheet's property grid, which had no horizontal gap between labels and values.

- [x] **Theme switcher**: new `SettingsDialog` (gear icon, `Settings02Icon`), sidebar footer row between the user name and the About button. Light/Dark toggle backed by `src/lib/theme.ts` (`useTheme()` hook) — **stored in `localStorage` only** (`trition-theme` key, `src/lib/theme-constants.ts`), never sent to Trello, since it's a per-device UI preference, not workspace data
- [x] **No flash-of-wrong-theme**: root layout keeps `dark` in `<html>`'s static className (unchanged default), and a `next/script` `beforeInteractive` script removes it before first paint if `localStorage` says `light`. `<html suppressHydrationWarning>` since the class is mutated outside React's render
- [x] **Light-mode pink palette** (`globals.css` `:root` only — `.dark` block untouched, per "we already have dark mode"): `--sidebar`/`--secondary` → `#FFDCF1`, `--sidebar-foreground` → black, `--secondary-foreground`/`--accent-foreground` → `#FF6EDF` (matches the reference `icon-button.png`/`input.png` send-button style, which turned out to already be this app's own `variant="secondary"` comment-send button), `--muted`/`--border`/`--input` → very light pink/off-white `#FFF5FB`/`#FFE9F6` (subtle, matches "borders... offwhite but very thin" — border width was already 1px, so this is a color change, not a width one). `--muted-foreground` deliberately left gray, per "icons... muted foreground or grayish is fine too". `--primary`/`--ring`/chart colors untouched (blue), since a full brand-color swap wasn't requested
- [x] **Card detail sheet decluttered**: the Members/Created By/Last Edited By/Status property grid had `gap-y-2` but no horizontal gap at all — label and value were touching. Now `grid-cols-[120px_1fr] gap-x-4 gap-y-3`; outer body padding `px-4 pb-4` → `px-5 pt-1 pb-5` (`gap-3` → `gap-4` between sections), and the sheet's title header padding matched to `px-5` so the title input lines up with the body content below it
- Not live-verified: the pink palette hasn't been screenshotted in a real browser session yet — flag if any contrast looks off (e.g. `#FF6EDF` on `#FFF0FA` for small icons)

## Phase 33 — Theme system overhaul, sheet/attachment/column gaps, bookmark previews, two real-time bugs — done
Requested in a fast follow-up round: bolder/dashed pink "create" buttons on the current (light) theme; a third experimental theme ("exp") with a fully specified palette; a fix for the Board Settings sheet not scrolling; missing image-attachment delete and missing custom-column editing inside the card detail sheet; bookmark blocks with no favicon/description; a question about rate-limit safety; and a real bug — deleting a page from the sidebar removed it in Trello but not from the UI until a manual refresh.

- [x] **Board Settings sheet scroll bug — fixed**: `SheetContent` had no `overflow-y-auto`, so once Phase 31/32 added enough sections the sheet just clipped instead of scrolling. One-line fix, same pattern `CardDetailSheet` already used
- [x] **Sidebar page-delete not reflected in real time — root-caused and fixed**: `SidebarPageLink.handleDelete` called `router.refresh()`, which only re-runs *Server Component* data — but the sidebar's Pages list is client-fetched state (`WorkspaceSidebarShell`'s own `useEffect` hitting `/api/boards/[boardId]/pages`), which `router.refresh()` never touches. Deleting now optimistically removes the list from that client state via a new `onDeleted` callback (also `router.push`es away if you delete the page you're currently viewing), instead of waiting on a refresh mechanism that was never going to reach it. **Flagging a likely sibling bug, not yet fixed**: `CreateWorkspaceButton` probably has the same class of issue — the sidebar's `boards` list comes from the shared `(app)/layout.tsx` Server Component and may not update after creating a workspace without a hard reload. Not reported yet, but worth checking next
- [x] **Theme system rebuilt as three-way (Light/Dark/Exp)**: `src/lib/theme.ts` (`useTheme()`), `src/lib/theme-constants.ts` (the `localStorage` key, split out so the server-rendered root layout can read the constant without pulling in client code), `src/components/shell/settings-dialog.tsx` (gear icon in the sidebar footer, left of About). **Stored in `localStorage` only, per explicit confirmation — never sent to Trello**, since it's a per-device UI preference. New visitors default to Dark (unchanged); the `next/script` `beforeInteractive` theme-init script prevents any flash of the wrong theme, including a special case: `/login` is now **hard-forced to Dark** regardless of the saved preference (matches the video intro), enforced twice — in the init script (covers hard loads, no flash) and a `LoginHero` mount effect that restores the prior theme on unmount (covers client-side/soft redirects to `/login`, e.g. an expired session, which don't re-run the init script since the root layout never remounts)
- [x] **Pink design language, current (Light) theme**: `secondary`-variant buttons (comment send, and every "create" action — table's "Add" row, "Create workspace", "Create page", "Add column", "Send invite") now render bg `#FFDCF1` / text+icon `#FF6EDF`, a dashed `#FF6EDF` outline, `font-semibold`, and bolder (`stroke-width: 2`) icons — all via one shared edit to the `secondary` variant in `src/components/ui/button.tsx`, gated by a new `--secondary-border` CSS var that's `transparent` in `.dark` (zero visual change there) and colored in `:root`/`.theme-exp`
- [x] **New "Exp" theme**: `.theme-exp` class in `globals.css`, full palette lifted directly from the user-supplied spec (background/sidebar/card surfaces, primary/muted text, the pink accent trio, dividers, and a dashed *input* border specifically — `.theme-exp [data-slot="input"], [data-slot="textarea"] { border-style: dashed }`). **Explicitly reverted per follow-up correction**: the spec's distinct "Not started" status-badge colors and the green avatar color were dropped — those are an already-shipped, theme-invariant feature and shouldn't have been special-cased for one theme; `StatusPills` and `Avatar` are untouched by any theme now, exactly as before
- [x] **Skeleton contrast fix**: `bg-muted` was nearly invisible against the new near-white Light/Exp backgrounds (muted and background are only a couple hex digits apart in both); switched to `bg-secondary/70`, which is both more visible and — as a side effect — a bit more visible in dark mode too (`#2f2f2f` vs `#191919` is more contrast than the old `#202020` vs `#191919`)
- [x] **Card detail sheet: custom columns were completely missing** — the sheet showed Members/Created By/Last Edited By/Status/Description but never the per-list custom columns from Phase 29, even though the same `props` data was already coming back from `GET /api/cards/[cardId]`. Now fetches that list's column schema (`GET /api/lists/[listId]/columns`, keyed off `card.idList`) once the card loads and renders each one inline via the existing `CustomCell` component (same edit widget the table uses), PATCHing `/api/cards/[cardId]/props` on change — full parity with the table, not just a read-only view
- [x] **Card detail sheet: attachments had no delete** — new `DELETE /api/cards/[cardId]/attachments/[attachmentId]` route (wraps the already-existing `deleteCardAttachment` client function, previously only used internally by the cover-image replace flow) and a hover/tap delete button on every attachment in `CardAttachments`, mobile-reachable per the Phase 31 convention, behind the standard `ConfirmDeleteDialog`
- [x] **Bookmark blocks now show a real favicon + meta description**: new `src/lib/link-metadata.ts` (server-side fetch + regex-parse of `og:description`/`<meta name="description">` and `<link rel="icon">`, no HTML parser dependency added) and `GET /api/bookmark-meta?url=`, cached 30 minutes per URL via the existing in-memory `cached()` helper so repeat views of the same link don't refetch the external site. `BookmarkBlock` fetches this client-side on mount/URL-change and renders the favicon in place of the generic bookmark icon plus a truncated description line, falling back cleanly (generic icon, no description line) if the fetch fails or the site has neither
- [x] **Answered, not a code change**: how the app avoids the Trello 100-req/10s limit — see the README's "Request-volume / rate-limit notes" section (two-layer caching, N+1 avoidance via batched `Promise.all`, optimistic UI cutting round-trips, debounced saves, and the Phase 31 Last-Edited-By toggle as a cost lever)
- Not live-screenshotted this round (browser tooling was returning a 0×0 viewport partway through — likely the local Chrome window was minimized, unrelated to the app); verified instead via `tsc`/`eslint` (both clean throughout) and one live functional check through the browser's JS console confirming the bookmark favicon/description actually round-tripped end-to-end. Recommend a manual pass over Settings → Exp theme, the card sheet's new column rows, and attachment delete before calling this fully verified

## Phase 34 — Sidebar real-time sync, public workspaces, workspace delete, Newsreader labels, SEO — done
Requested in a further follow-up: the sidebar not updating after creating a workspace or a page (same root cause as the Phase 33 page-delete fix, but for creates); public workspaces showing the wrong (private/lock) icon and having no shareable link; sidebar pages having a delete affordance but no rename one; no way to delete a workspace at all; a font/casing change for every small uppercase section label; and full SEO metadata (OG image, favicon, robots, sitemap).

- [x] **Sidebar real-time sync, generalized**: new `SidebarRefreshProvider`/`useSidebarRefresh()` (`src/lib/sidebar-refresh.tsx`), wrapping `AppShell` in `(app)/layout.tsx` so both the sidebar and the main content area (siblings, not nested) can reach it. Exposes a `nonce` the sidebar's existing fetch effects now also depend on, plus `refreshSidebar()` to bump it — called after `CreateWorkspaceButton`, `NewPageButton`, and `BlockComposer`'s `/page` and `/table` slash commands all succeed. `getBoardLists` (pages) was already uncached so refetching is always fresh; `getMyBoards` (workspaces) *is* 60s-cached, so `POST /api/boards` now calls a new `invalidate()` (`src/lib/trello/cache.ts`) on that key right after creating, so a same-second refetch can't come back stale and silently "miss" the board that was just created
- [x] **Public workspace icon + share link**: sidebar workspace icons were previously only Private-or-Org (`org` → building, everything else including `public` → lock — a real bug, public boards showed as private). Added a `boardIcon()` helper: private → lock, org → building, public → `GlobeIcon`. **Board Settings → Visibility → Public** now shows the board's real Trello URL (`board.url`, already fetched by `getBoard`) in a read-only input with a copy button — closes the "public share link surfacing" item that had been sitting in the backlog since Phase 11/14
- [x] **Sidebar page rename**: `SidebarPageLink` gained a `PencilEdit02Icon` next to the existing delete icon (same mobile-safe hover pattern), inline rename on click (same convention as `PageBlock`'s block-canvas rename), `PATCH /api/lists/[listId]` on blur, `onRenamed` callback updating the sidebar's local pages state directly (no refetch needed, mirrors the Phase 33 delete fix)
- [x] **Delete a workspace — added using Trello's real permanent-delete endpoint**: `deleteBoard()` (`DELETE /1/boards/{id}`, genuinely destroys the board, not a reversible archive) plus `DELETE /api/boards/[boardId]`. Surfaced as a "Danger zone" section at the bottom of Board Settings — requires typing the exact board name into a field before the "Delete workspace forever" button enables (stronger friction than the app's usual `ConfirmDeleteDialog`, deliberately, since this is the one truly irreversible action in the app — everything else uses Trello's `closed=true` archive). On success: closes the sheet, calls `refreshSidebar()`, navigates to `/home`
- [x] **Small uppercase section labels → Newsreader, not uppercase**: added the Google Font (`next/font/google`, `--font-newsreader` → Tailwind `font-label`) alongside the existing Geist/Yesteryear fonts. Every label that used the old `text-xs font-medium tracking-wide uppercase text-muted-foreground` recipe (sidebar "Workspaces"/"Pages", card-detail-sheet "Description"/"Comments", Board Settings' "Cover image"/"Labels"/"General…"/"App settings…"/"Danger zone", the lobby popover's "Recent activity") now reads in title case in the serif label font instead
- [x] **SEO metadata**: `metadataBase` + full `openGraph`/`twitter` tags using the provided `public/banner.png`, `icons` pointing at `public/favicon.png`, a rewritten description ("uses Trello as its database and storage" — no "backed by Trello" phrasing, per explicit request), and new `src/app/robots.ts`/`src/app/sitemap.ts` (App Router metadata-file convention) — robots disallows the authenticated app routes (`/api`, `/home`, `/b`, `/auth`) and points at the sitemap, which currently only lists `/login` since everything else requires a session and has nothing public to index
- Verified live end-to-end this round (not just typecheck/lint): the skeleton contrast fix, the public-board globe icon + copyable Trello link, the Danger Zone type-to-confirm gating, and the sidebar page rename icon all confirmed in a real logged-in browser session

## Phase 35 — Table-block sidebar leak fix, Databuddy analytics — done
Reported: "I added a table in a newly created page and it shows in the sidebar and clicking opens a new page with just the table." Confirmed and root-caused, plus checked whether the other block types have the same problem.

- [x] **Root cause**: `/table` (like `/page`) creates a real backing Trello **list** — for Page blocks that's correct and intended (a page block *is* meant to be a standalone, independently-navigable page). For Table blocks it's an implementation detail — the embedded `TableBlock` component has no "open as full page" link at all, so the only reason that backing list was ever reachable on its own was that nothing excluded it from the sidebar's Pages list or the bookmark block's "link to an existing page" search, both of which just list every non-home list on the board. Text/Bookmark/Image blocks don't create a list at all, so they were never at risk — confirmed by reading the composer's creation code, not by testing all four again individually
- [x] **Fix**: `WorkspaceSettings` (`src/lib/trello/board-settings.ts`, the board-`desc`-marker mechanism from Phase 31/33) gained a `tableListIds: string[]` field. `POST /api/lists/[listId]/blocks` now appends the new list's id there the moment a table block is created (with a matching `cache.ts` `invalidate()` call so a same-second sidebar refetch can't read a stale board `desc`). Every place that builds a navigable "pages" list — `/api/boards/[boardId]/pages`, `/api/home/pages`, and all four page routes' `pageNames` computation — now also excludes ids in `tableListIds`, alongside the existing home-list exclusion
- [x] **Verified live**: created a table via `/table` on a real page, confirmed the embedded table renders fine and the sidebar's Pages list — checked both visually and via a DOM query — shows no new entry for it
- [x] **Databuddy analytics** added (`@databuddy/sdk/react`, `Databuddy` mounted in the root layout, client ID from `NEXT_PUBLIC_DATABUDDY_CLIENT_ID`, `trackWebVitals` + `trackErrors` enabled). Renders nothing if the env var is unset, so it's opt-in for anyone self-hosting from this repo — `.env.local.example` documents the var as blank/optional
- Known gap, not fixed this round (out of scope for the reported bug, consistent with how the rest of the app already tolerates similar orphaned state — e.g. Phase 29's uncollected column values): deleting a Table block only archives the referencing card, not its backing list, so the list — and its `tableListIds` entry — stays around unused. It was already excluded from navigation before deletion, so this isn't user-visible, just a bit of Trello-side clutter

## Phase 36 — Demo login, login page background pin — done
Requested: a way for people without a Trello account to try the app with one click, resetting itself over time; drop Google entirely (never implemented, no plans to build it) in favor of that button; login page background locked to `#181818` regardless of the signed-in theme preference.

- [x] **"Try now" demo login**: `POST /api/auth/demo` (`src/app/api/auth/demo/route.ts`). Gated entirely behind `DEMO_TRELLO_TOKEN` being set — if it's not, the button doesn't render at all (`demoTrelloToken()` checked server-side in `src/app/login/page.tsx`, passed down as a boolean prop so the client component never sees the token itself)
- [x] **Reset mechanism, no cron needed**: on every click, before creating/reusing anything, checks `dateLastActivity` (added to `getMyBoards`' fetched fields) across all boards on the demo account; if the most recent activity anywhere is over an hour old, deletes every board on the account (`deleteBoard`, already existed from Phase 34's workspace-delete feature). The app's existing first-visit-ever logic (`/home`'s `boards.find(...) ?? createBoard(...)`) then recreates a fresh, empty personal board the moment anyone lands there — no new "create a demo board" code needed, it's the exact same path a brand-new real user goes through
- [x] **Deliberately NOT per-visitor-isolated**: this is one shared account/session, not a sandbox per click — concurrent demo visitors see the same boards. Building real isolation (either a Trello account per visitor, impossible without signup, or scoping logic so one shared account's boards can't leak between sessions) is a lot of surface area for a "let people poke around" button; flagged as a possible future upgrade, not attempted now
- [x] **Google button removed entirely**: it was always a disabled placeholder (`disabled`, "Google sign-in is coming later"), never implemented, explicitly no plans to. Swapped for the demo button (`PlayCircleIcon`, Hugeicons) in the exact same grid slot; `GoogleMark` (`src/components/icons.tsx`) deleted since nothing referenced it anymore
- [x] **Login page background pinned to `#181818`**: `LoginHero`'s root div, regardless of the signed-in-user's saved theme (login already force-overrides to dark for the video intro, per Phase 32 — this pins the exact shade on top of that, only on this one page)
- Not live-verified this round: no throwaway Trello account/token has been provisioned yet, so the actual demo-login round-trip hasn't been clicked through against real Trello — verified via `tsc`/`eslint` (clean) and code reading (redirect status is `303` so the browser correctly converts the POST to a GET on the way to `/home`, matching the existing logout route's pattern) instead

## What's left / next phase (honest current state, 2026-08-09)
- **Generic File block** (Phase 14) — any file type, not just images.
- **Broader mobile audit beyond hover-reachability + padding**: markdown editor toolbar and the block composer's `/`-menu / bookmark-suggestion dropdowns aren't tested for overflow on very narrow (<360px) viewports; no dedicated touch-gesture pass (e.g. swipe-to-delete) has been done — current fix only guarantees every action has a tappable, always-visible affordance
- **Verify the new Phase 31 work live**: OAuth consent screen actually renders "Trition", the Board Settings prefs round-trip against real Trello, "In lobby" shows sensible entries on a board with real activity, and the Last-Edited-By column/toggle behaves correctly on a large table
- **Custom columns**: still not sortable/filterable (Phase 29 scoped-out item); deleting a column still doesn't sweep its orphaned value out of every row's `props`
- **Smaller polish carried over**: theme toggle, retry-on-429, public share-link surfacing, deploy prep, the literal "promote a nested page to its own workspace" flow (Phase 10)
- **Persistent-connection question** (WebSockets) — still not worth building for this app's scale; see Phase 11/14 discussion above, unchanged
- **Known limitation**: server-side cache is per-process in-memory, won't share across multiple serverless instances if ever deployed somewhere like Vercel with multiple concurrent instances. The board-settings and last-editor caches added in Phase 31 inherit this same limitation
- **Possible future workspace settings** (not built, just flagged as candidates): per-page icon/emoji, default table density, default sort order per table — all would follow the same board-`desc`-marker pattern as `showLastEditedColumn`
