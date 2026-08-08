# DaSpace — CHECKLIST

Tracks current build phase. Update this file whenever a phase starts/finishes — don't let it go stale.

**Current phase: Phase 7 (table block) mostly done, Phase 8 (card detail panel) mostly done. Phase 5/6 (block-type storage, slash-command editor, nested pages) not started — the app currently renders one table per list via real routes, not yet a block-based page canvas.**

---

## Bugs found & fixed
- [x] `/login` was reachable while already authenticated (no redirect-away) — now redirects to `/` if a valid token cookie exists
- [x] Geist font wasn't rendering (fell back to serif) — `globals.css` had a circular `--font-sans: var(--font-sans)`; fixed to point at `--font-geist-sans`
- [x] OAuth `return_url` hardcoded to port 3000 collided with an unrelated project also on 3000 — DaSpace now runs on a dedicated port (3211 via `next dev -p 3211`), `NEXT_PUBLIC_APP_URL` updated to match

## Phase 0 — Planning
- [x] Review `/ref` screenshots (dashboard, sidebar, tables, trello board, login page)
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
- [x] Add shadcn/ui (button, input, textarea, separator, avatar, scroll-area, sheet)
- [x] Add Geist font (Google Fonts) via `next/font/google`
- [x] Notion-style theme tokens (dark/light) in `globals.css`
- [x] Basic layout shell (sidebar + main content area)
- [x] Hugeicons (`@hugeicons/react` + `@hugeicons/core-free-icons`) — used for all in-house icons instead of lucide-react. lucide-react is still a transitive dependency of a couple of shadcn primitives (e.g. was in `sheet.tsx`'s generated close icon, swapped to Hugeicons) — swap on sight whenever a newly-added shadcn component brings one in

## Phase 3 — Auth
- [x] Login screen UI per `login-page.png` style (centered mark, headline, option buttons)
- [x] "Continue with Trello" — OAuth token flow, working end-to-end
- [x] "Continue with Google" — visible, disabled
- [x] Store token server-side (httpOnly cookie via Next.js route)
- [x] Logout (form POST to `/api/auth/logout`, clears cookie)
- [x] 401-from-Trello handling: `withAuthGuard()` redirects to `/api/auth/trello/expire`, which clears the cookie and sends the user back to `/login`

## Phase 4 — Onboarding & sidebar
- [x] Fetch boards for logged-in user (`getMyBoards` → `/members/me/boards`, which returns boards the user owns *and* boards shared with them — no separate logic needed)
- [x] On login, `/` auto-redirects to the first board, which auto-redirects to its first list — real cards, no empty state (unless the account genuinely has no boards/lists, which shows a proper empty state instead of a blank screen)
- [x] Sidebar renders real boards ("Workspaces") and real lists of the active board ("Pages"), both as live Next.js routes (`/b/[boardId]`, `/b/[boardId]/l/[listId]`)
- [ ] "+ New Page" from the sidebar (create a new list) — not built yet

## Phase 5 — Data model foundation
- [ ] Block-type storage mechanism (hidden marker in `desc`, per SPEC §4/§13) — **not started**. Current table view treats every card in a list as a plain row, not a typed block
- [x] Created By — derived per-card via `getCardCreator` (`filter=createCard` action), shown in table + detail panel
- [ ] Last edited by — **not implemented** (SPEC's "most recent action" derivation still TODO)
- [x] Trello API client (`src/lib/trello/client.ts`) — boards, lists, cards, members, comments, create/update/archive card, add comment

## Phase 6 — Slash-command block editor
- [ ] Not started. Pages currently render as a single table view per list, not a block canvas. This is the biggest remaining gap vs. SPEC.md's nested-pages/blocks model.

## Phase 7 — Table block
- [x] Render list's cards as rows (Name, Status/labels, Members, Created By)
- [x] Add row (create card, inline input at bottom of table)
- [x] Delete row (hover trash icon → archive) and archive from the detail panel
- [ ] Inline cell editing (currently name is only editable from the detail panel, not inline in the table cell)
- [ ] "+ Add a property" (Custom Fields: Text/Number/Date/Checkbox/Select) — not built
- [x] Row click → right-side detail panel (shadcn Sheet)

## Phase 8 — Card detail panel
- [x] Right-side sheet on row click, fetched via `/api/cards/[cardId]`
- [x] Editable title (blur-to-save)
- [x] Members, Created By (read-only), Status/labels (read-only pills)
- [ ] "+ Add a property" — not built (depends on Phase 5/7 custom fields work)
- [x] Description shown (read-only — no editor yet)
- [ ] Attachments (upload/view images & video) — not built
- [x] Comments feed (list + add, live via `/api/cards/[cardId]/comments`)
- [x] Archive card action

## Phase 9 — Other block types
- [ ] Bookmark block, Image block, Text block — not started (depends on Phase 5/6)

## Phase 10 — Workspace promotion & sharing
- [ ] Not started

## Phase 11 — Polish
- [ ] Theme toggle (dark is default and only mode wired up right now)
- [ ] Loading states for the table/sheet (currently blank while fetching)
- [ ] Rate-limit handling / retry-on-429 — not handled; note per-card `getCardCreator` is one Trello request per card, so a very large list could approach rate limits (see SPEC.md known-gaps note; batch endpoint not used yet)

## Phase 12 — Deploy
- [ ] Pick hosting (Vercel likely, given Next.js)
- [ ] Env vars for Trello API key in production
- [ ] Production OAuth return URL configured
