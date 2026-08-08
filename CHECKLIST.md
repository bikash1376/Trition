# DaSpace — CHECKLIST

Tracks current build phase. Update this file whenever a phase starts/finishes — don't let it go stale.

**Current phase: Phase 4 in progress — Trello API key still needed from user to go further**

---

## Phase 0 — Planning
- [x] Review `/ref` screenshots (dashboard, sidebar, tables, trello board, login page)
- [x] Confirm Trello API is free + understand rate limits
- [x] Write `SPEC.md` v1 (single-table-per-list model)
- [x] Revise `SPEC.md` v2 — nested pages, block-based editor, workspace promotion, sharing
- [x] Write this `CHECKLIST.md`

## Phase 1 — Trello app credentials
- [ ] Create API key at `trello.com/power-ups/admin` (New → API Key) — **blocked on user**
- [ ] Drop key into `.env.local` (see `.env.local.example`, already scaffolded)
- [x] OAuth flow decided: token redirect (`response_type=token`), not full 3-legged OAuth1.0a — no client secret needed to log a user in
- [x] `return_url` wired to `/auth/trello/callback`, driven by `NEXT_PUBLIC_APP_URL`

## Phase 2 — Project scaffold
- [x] Init Next.js (App Router) project — Next 16.3, React 19.2, TypeScript
- [x] Add Tailwind v4
- [x] Add shadcn/ui (button, input, separator, avatar, scroll-area so far)
- [x] Add Geist font (Google Fonts) — via `next/font/google`, default in create-next-app template
- [x] Set up base theme tokens (Notion-style dark/light) in `globals.css`
- [x] Basic layout shell (sidebar + main content area)

## Phase 3 — Auth
- [x] Login screen UI per `login-page.png` style (centered mark, headline, option buttons)
- [x] "Continue with Trello" — OAuth token flow wired end-to-end (untestable until a real API key is added)
- [x] "Continue with Google" — visible, disabled
- [x] Store token server-side (httpOnly cookie via Next.js route)
- [x] Logout (form POST to `/api/auth/logout`, clears cookie)

## Phase 4 — Onboarding & sidebar
- [ ] Fetch boards for logged-in user — needs live API key to build/test against
- [ ] On first login, auto-open a default page (first board's first list) with real cards — no empty state
- [x] Sidebar shell renders (static placeholder — no real page tree yet)
- [ ] "+ New Page" creates a new top-level (personal/private) landing page

## Phase 5 — Data model foundation
- [ ] Decide + implement block-type storage mechanism (hidden marker in `desc` — see SPEC §4/§13)
- [ ] Helper layer: read/write block type + metadata on a card
- [ ] Derive Created By / Last edited by from card actions (shared helper, used by table + detail panel)

## Phase 6 — Slash-command block editor
- [ ] Enter creates a new empty block/line in a page
- [ ] Typing `/` opens block-type menu (Text, Table, Bookmark, Image, Page)
- [ ] Menu filters as you keep typing after `/`
- [ ] Selecting a type creates/configures the underlying card
- [ ] Continuing to type without selecting closes the menu, falls back to Text block
- [ ] `/page` → creates new List + inserts page-link block in current page
- [ ] Page-link block always renders the live name of the List it references (no caching)

## Phase 7 — Table block
- [ ] Render a table block's cards as rows (Name, Status, Members, Created By, Last edited by)
- [ ] Add row (create card) / inline edit cell / delete-archive row
- [ ] "+ Add a property" limited to Trello-feasible types (Text/Number/Date/Checkbox/Select via Custom Fields)
- [ ] Row click → right-side detail panel

## Phase 8 — Card detail panel
- [ ] Right-side peek panel on row click
- [ ] Editable title, Members, Created By (read-only), Status, "+ Add a property"
- [ ] Description editor (markdown text)
- [ ] Attachments (upload/view images & video)
- [ ] Comments feed (list + add)

## Phase 9 — Other block types
- [ ] Bookmark block (link attachment → preview card render)
- [ ] Image block (full-bleed, no row chrome)
- [ ] Text block (inline paragraph render)

## Phase 10 — Workspace promotion & sharing
- [ ] "Turn into workspace" — create new Board, move List via `idBoard`
- [ ] Page options menu (top of page) surfaces promote action
- [ ] "Share" — enabled only for workspace-level pages; sets board `permissionLevel=public`, surfaces public URL
- [ ] "Share" on a nested page — disabled with "Promote to workspace to share this page" prompt

## Phase 11 — Polish
- [ ] Notion-accurate theming pass (dark + light)
- [ ] Empty states, loading states
- [ ] Rate-limit handling / retry-on-429

## Phase 12 — Deploy
- [ ] Pick hosting (Vercel likely, given Next.js)
- [ ] Env vars for Trello API key in production
- [ ] Production OAuth return URL configured
