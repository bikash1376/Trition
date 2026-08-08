# DaSpace — CHECKLIST

Tracks current build phase. Update this file whenever a phase starts/finishes — don't let it go stale.

**Current phase: full 2026-08-08 bug/UX backlog cleared, request caching added, and all 4 planned block types now exist (Text/Page/Bookmark/Image). Remaining big items: Table block type, block canvas on pages beyond Home, multiple personal landing pages, custom properties, workspace promotion/sharing, deploy.**

---

## Bugs found & fixed
- [x] `/login` was reachable while already authenticated (no redirect-away) — now redirects to `/` if a valid token cookie exists
- [x] Geist font wasn't rendering (fell back to serif) — `globals.css` had a circular `--font-sans: var(--font-sans)`; fixed to point at `--font-geist-sans`
- [x] OAuth `return_url` hardcoded to port 3000 collided with an unrelated project also on 3000 — DaSpace now runs on a dedicated port (3211 via `next dev -p 3211`), `NEXT_PUBLIC_APP_URL` updated to match

## Bugs & UX issues reported (2026-08-08 live testing) — all fixed
- [x] Images on cards didn't display — `getCardAttachments` added; detail sheet fetches attachments and renders real `<img>`/`<video>`. Served through a same-origin proxy route (`/api/attachments/[cardId]/[attachmentId]`) that streams the file through with the Trello key/token server-side, since attachment URLs may need Trello auth — safer than trusting `attachment.url` to be public
- [x] Video attachments — same fix, renders `<video controls>` when `mimeType` starts with `video/`
- [x] Detail sheet "Archive card" — now a plain underlined text action, no border/icon/button chrome
- [x] Status editor — `LabelPicker` (new shared component) filters board labels to `label.name.trim().length > 0`, so Trello's default nameless color swatches never show up as options
- [x] Table row delete icon — moved to a new leftmost unlabeled column
- [x] Custom scrollbar — thin (6px), theme-matched (`--scrollbar-thumb`/`--scrollbar-thumb-hover` tokens, light+dark), applied globally via `*::-webkit-scrollbar` + `scrollbar-color` in `globals.css`; the sidebar's shadcn `ScrollArea` thumb resized/recolored to match
- [x] Detail sheet title `Input` — was `h-8` fixed height clipping `text-xl` line-height; now `h-auto` with proper padding/leading
- [x] Status is now editable **inline directly in the table cell** via `LabelPicker` — no need to open the sheet (also wired into the sheet itself for consistency)
- [x] Bare-link cards (`card.name` matches a URL) render as an `<a target="_blank" rel="noopener noreferrer">` in the Name cell instead of opening the detail sheet on click
- [x] Member avatar hover — `HoverCard` showing avatar/full name/username, wired into `AvatarStack`. No extra caching needed for this specific case: member data is already fetched once per page load and held in the component tree, so hovering never triggers a new request
- [x] Personal space vs. workspace / clicking workspace name opens an editable home page — fixed via the Phase 5/6 `DaSpace` home-list block canvas (previous session)
- [x] `ref/sidebar-left.png` noted — sidebar now has a distinct "Home" link; still doesn't have a "Private" section or "Invite"/"New" action bar, revisit once multiple personal pages exist (see Phase 6 follow-ups)

## Request-volume / rate-limit reduction (2026-08-08)
Trello's real limit: **100 requests / 10s per token** (~10/s sustained) — worth protecting against given `getCardCreator` alone was already one request per card per table render.
- [x] Server-side in-memory TTL cache (`src/lib/trello/cache.ts`, `cached()` helper) wraps the calls that are hot-path but rarely change: `getMe`, `getMyBoards`, `getBoardMembers`, `getBoardLabels` (60s TTL), and `getCardCreator` (60min TTL — a card's creator never changes once set, so this one is effectively permanent for a session)
- [x] Client-side `localStorage` cache (`src/lib/local-cache.ts`) added specifically where the user pointed at it: the detail sheet's board-labels fetch (10min TTL, keyed per board) — labels are common/rarely-edited, so repeat card opens on the same board no longer refetch them
- [ ] **Known limitation:** the server-side cache is per-process in-memory — fine for `next dev`/single-instance `next start`, but won't be shared across multiple serverless instances if deployed to something like Vercel. A real fix (Redis/Vercel KV/etc.) is out of scope for now; noted here so it isn't forgotten before Phase 12 (Deploy)
- [ ] Not yet cached: `getBoardLists` (intentionally — new pages must appear immediately after `/page`), `getListCards`, per-card data in the sheet (members/comments/attachments/description — all genuinely can change and are fetched on-demand only when a card is opened, so caching them risks staleness for little benefit)

## Phase 0 — Planning
- [x] Review `/ref` screenshots (dashboard, sidebar, tables, trello board, login page, workspace page, sidebar-left)
- [x] Confirm Trello API is free + understand rate limits
- [x] Write `SPEC.md` v1 (single-table-per-list model)
- [x] Revise `SPEC.md` v2 — nested pages, block-based editor, workspace promotion, sharing
- [x] Write this `CHECKLIST.md`

## Phase 1 — Trello app credentials
- [x] Create API key at `trello.com/power-ups/admin` — done by user
- [x] Drop key into `.env`
- [x] OAuth flow: token redirect (`response_type=token`), no client secret needed
- [x] `return_url` wired to `/auth/trello/callback`, driven by `NEXT_PUBLIC_APP_URL`

## Phase 2 — Project scaffold
- [x] Init Next.js (App Router) project — Next 16.3, React 19.2, TypeScript
- [x] Add Tailwind v4
- [x] Add shadcn/ui (button, input, textarea, separator, avatar, scroll-area, sheet, popover, hover-card)
- [x] Add Geist font (Google Fonts) via `next/font/google`
- [x] Notion-style theme tokens (dark/light) in `globals.css`, including scrollbar tokens
- [x] Basic layout shell (sidebar + main content area)
- [x] Hugeicons (`@hugeicons/react` + `@hugeicons/core-free-icons`) — used for all in-house icons instead of lucide-react. Swapped on sight in every shadcn component that shipped one (`sheet.tsx`'s close icon)

## Phase 3 — Auth
- [x] Login screen UI per `login-page.png` style (centered mark, headline, option buttons)
- [x] "Continue with Trello" — OAuth token flow, working end-to-end
- [x] "Continue with Google" — visible, disabled
- [x] Store token server-side (httpOnly cookie via Next.js route)
- [x] Logout (form POST to `/api/auth/logout`, clears cookie)
- [x] 401-from-Trello handling: `withAuthGuard()` redirects to `/api/auth/trello/expire`, which clears the cookie and sends the user back to `/login`

## Phase 4 — Onboarding & sidebar
- [x] Fetch boards for logged-in user (`getMyBoards` → `/members/me/boards`, returns owned *and* shared boards)
- [x] On login, `/` auto-redirects to the first board, which now IS the home page (see Phase 6) — real content, no empty state
- [x] Sidebar renders real boards ("Workspaces"), a distinct "Home" link, and real lists of the active board ("Pages")
- [x] "+ New Page" achievable via `/page` in the Home canvas; a direct sidebar button still not built (endpoint exists: `POST /api/boards/[boardId]/pages`)

## Phase 5 — Data model foundation
- [x] Block-type storage mechanism **decided and implemented**: hidden marker as the first line of a card's `desc`, parsed/serialized in `src/lib/trello/blocks.ts`
- [x] Created By — derived per-card via `getCardCreator`, cached long-TTL (see caching section above)
- [ ] Last edited by — **not implemented**
- [x] Trello API client (`src/lib/trello/client.ts`) — boards, lists, cards, members, labels, attachments, comments, create/update/archive card, add/remove label, create list, update card desc — now with a caching layer for the stable reads

## Phase 6 — Slash-command block editor
- [x] **MVP built.** Every board auto-gets a `DaSpace` list, rendered by `BlockCanvas` at `/b/[boardId]` as the home page
- [x] Bottom-of-page composer: `/` opens a filtered menu (**Text**, **Page**); unmatched text falls back to a literal Text block
- [x] `/page` → new list + page-link block, shows up in the sidebar immediately
- [x] Page-link blocks render the *live* name of the list they reference
- [x] Text blocks inline-editable (auto-growing textarea, saves on blur)
- [ ] **Still not covered:**
  - Only the Home list is a block canvas — other pages (Bugs/Features/etc., pages made via `/page`) always render as a table, not recursively as their own canvas
  - Only Text/Page block types — no Table/Bookmark/Image in the slash menu (Phase 9)
  - No in-place "/" editing on an *existing* block, only in the bottom composer
  - Still one Home per board, not multiple private/personal pages a user can create and switch between

## Phase 7 — Table block
- [x] Render list's cards as rows (Name, Status/labels, Members, Created By)
- [x] Add row (create card, inline input at bottom of table)
- [x] Delete row (leftmost hover trash icon → archive) and archive from the detail panel
- [x] Inline Status editing directly in the table cell (`LabelPicker`)
- [ ] Inline Name editing directly in the table cell — still only via the detail panel
- [ ] "+ Add a property" (Custom Fields: Text/Number/Date/Checkbox/Select) — not built
- [x] Row click → right-side detail panel (shadcn Sheet), except bare-link cards which open the link instead

## Phase 8 — Card detail panel
- [x] Right-side sheet on row click, fetched via `/api/cards/[cardId]`
- [x] Editable title (blur-to-save, fixed height bug)
- [x] Members, Created By (read-only), Status/labels (now editable via `LabelPicker`)
- [ ] "+ Add a property" — not built (depends on Phase 5/7 custom fields work)
- [x] Description shown (read-only — no editor yet)
- [x] Attachments — images render inline, videos get a real `<video>` player, everything else is a download link
- [x] Comments feed (list + add, live via `/api/cards/[cardId]/comments`)
- [x] Archive card action (now styled as plain text)

## Phase 9 — Other block types
- [x] Bookmark block — `/bookmark` in the Home canvas composer: paste a link, renders as a bordered preview card (title + hostname), opens in a new tab. No og-metadata scraping (no title/thumbnail fetch) — title is just the hostname
- [x] Image block — `/image` opens a native file picker, uploads the file to Trello as a real card attachment (`uploadCardAttachment`), stores the attachment id in the block marker, renders via the same `/api/attachments/...` proxy used by the detail sheet
- [x] Text, Page blocks — done in Phase 6

## Phase 10 — Workspace promotion & sharing
- [ ] Not started

## Phase 11 — Polish
- [ ] Theme toggle (dark is default and only mode wired up right now — light tokens exist in `globals.css` but there's no UI switch)
- [x] Custom thin scrollbar, theme-matched, applied globally
- [ ] Loading states for the table/sheet (currently blank while fetching)
- [x] Rate-limit mitigation — server + client caching layer added (see caching section above); still no explicit retry-on-429 handling if a burst does exceed the limit

## Phase 12 — Deploy
- [ ] Pick hosting (Vercel likely, given Next.js) — note the in-memory cache limitation above before deploying to a multi-instance target
- [ ] Env vars for Trello API key in production
- [ ] Production OAuth return URL configured
