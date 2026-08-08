# DaSpace — SPEC

Notion-style workspace UI, backed entirely by Trello as the database. No app-owned database for content.

## 1. One-liner

Log in with Trello → land straight in an already-populated page (real Trello cards, no empty state) → sidebar holds a tree of Pages → any page can contain block-based content (text, tables, bookmarks, images, nested sub-pages) → any page can be promoted into its own standalone Workspace and optionally shared publicly.

## 2. Trello API — feasibility (confirmed)

- **Free.** Get an API key at `trello.com/power-ups/admin` → New → API Key. No paid tier gates API access.
- **Auth:** "Login with Trello" = OAuth1.0a token flow. Redirect user to
  `https://trello.com/1/authorize?expiration=never&scope=read,write,account&response_type=token&key=API_KEY&name=DaSpace&return_url=...`
  Trello returns a per-user token — no client secret needed for this flow. Token stored server-side in an httpOnly cookie via a thin Next.js route, sent as `key`+`token` on every API call.
- **Rate limits:** 300 req/10s per API key, 100 req/10s per user token, 100 req/900s for `/members/`. Fine for personal/small-team use — revisit if multi-tenant scale (limits are shared per key across all users).
- **Underlying plan limits still apply** to whoever's Trello account we read/write (free plan = 10 boards/workspace, 10MB/attachment). Not a blocker for v1.

## 3. Reference UI (`/ref`)

- `trello-look.png` — the real board being modeled: lists Bugs / Features / Links / Ideation; cards show a label color bar, description icon, attachment count, member avatars.
- `tables-1.png`, `tables-2.png` — Notion table: columns Name / Status / Created By / Last edited by / People, "add property" type picker, Status as a grouped dropdown.
- `expanded-sidebar.png` — row click opens a right-side peek: editable title, Members, Created By, Status, "+ Add a property", Comments feed.
- `dashboard-page.png` — a Notion page containing a bookmark-style link block and a link to a sub-page ("Features") — this is the template for **page-link blocks** and **nested pages** below.
- `login-page.png` — **style reference only** (this is Notion's actual login screen). We reuse the visual pattern — centered mark, headline, subheadline, divider ("or continue with"), icon+label option buttons — but with only two options: **Continue with Trello** (live) and **Continue with Google** (visible, disabled, no backend for it yet).

## 4. Core data model — Pages & Blocks on top of Trello

Trello has no native concept of "nested page" or "block." Everything below is a deliberate mapping so DaSpace can offer that experience while Trello stays the *only* datastore.

| DaSpace concept | Trello object |
|---|---|
| Workspace | Board |
| Page | List |
| Block (a line of content inside a page) | Card |
| Block type (text / table / bookmark / image / page-link / …) | Not native — see "Block type storage" below |
| Sub-page (page nested inside a page) | Another List on the same Board, referenced by a **page-link block** card in the parent List |
| Table block | A page-link block, rendered inline as a full table (see §6) instead of just a title+icon link |
| Bookmark block | Card with a link attachment, rendered as a preview card |
| Image block | Card with one image attachment, rendered full-bleed, no row chrome |
| Text block | Card whose description is rendered inline as a paragraph, no row chrome |
| Status (within a table block) | Label |
| Members | Card `idMembers` (native) |
| Created By | Derived: first action on card (`filter=createCard`) → `idMemberCreator` |
| Last edited by | Derived: most recent action on card → `idMemberCreator` (best-effort; Trello has no single "last modified by" field) |
| Comments | Card `actions` filtered to `commentCard` |

### Block type storage (open decision, default proposed)

Trello cards have no `type` field. Default approach: store a hidden marker as the first line of the card's `desc`, e.g. `<!-- daspace:block=table;ref=<listId> -->`, followed by the actual content. DaSpace parses and strips this marker before rendering; opening the raw card in Trello directly is the only place it'd be visible, as an ugly first line. Alternative considered and rejected for v1: a Label per block type — rejected because Status already uses Labels and it would visibly clutter the user's native Trello board.

Non-Trello-native block types (to-do lists, dividers, callouts, code blocks, custom embeds) are **allowed in the slash menu anyway** — persisted the same way (structured JSON in the hidden marker, or in a comment if larger), rendered richly by DaSpace's own frontend. The goal per your instruction: *the end user of DaSpace should never feel a block "isn't really part of Trello"* — Trello remains the only store, DaSpace's renderer does the rest.

## 5. Login & onboarding flow

1. Login screen (styled per `login-page.png`): "Continue with Trello" (live), "Continue with Google" (disabled).
2. On successful Trello auth, DaSpace fetches the user's boards and immediately opens a default page — no empty state. Default = first board's first list, pre-populated with the user's real existing cards (e.g. their actual `iota` board with Bugs/Features/Links/Ideation).
3. Sidebar renders that board's lists as a page tree; user lands inside a page immediately, not a blank dashboard.

## 6. Sidebar & page creation

- Sidebar "+ New Page" creates a new top-level **landing page** — a new List, personal/private by default (only the creator sees it).
- A user can have **multiple landing pages**.
- Inside any page's content, typing `/page` on a line opens a suggestion to create a **nested sub-page**: confirming (Enter or click) creates a new List and inserts a **page-link block** card in the current page referencing it. Editing state ends immediately after creation.
- Clicking a page-link block navigates into that page. Editing its title there edits the underlying List's `name` — since the parent's page-link block always renders the *live* name of the List it references (not a cached copy), the outer page automatically reflects the new title. No sync logic needed — Trello is the single source of truth.

## 7. Slash-command block editor (inside a page)

- Pressing **Enter** inside a page starts a new empty block/line.
- Typing `/` opens an inline menu of block types, filtered as you keep typing (e.g. `/tab` → Table). Menu candidates: **Text, Table, Bookmark, Image, Page** (v1 — natively backable), plus DaSpace-native extras added as time allows (To-do, Divider, Callout, Code, Video/embed — all persisted via the block-type-storage mechanism in §4).
- Selecting an option (click or Enter) confirms the block type and creates/configures the underlying card accordingly.
- If the user keeps typing instead of selecting anything, the menu closes and the typed text (including the `/…`) becomes literal content of a default **Text** block. The menu does not reopen unless `/` is typed again at a fresh block.

## 8. Table block (full page-as-table view)

Same as before, now framed as one specific block type rather than the only page layout:

- Columns: **Name, Status, Members, Created By, Last edited by**.
- "+ Add a property" — only offers types Trello can actually back via the Custom Fields Power-Up: **Text, Number, Date, Checkbox, Select**. (Multi-select, URL, Phone, Email, Relation, Rollup, Formula, Button are not real Trello field types — excluded, not faked here since this is the one place we mirror raw Trello data 1:1.)
- Inline add row → `POST /1/cards`. Inline edit cell → `PUT /1/cards/{id}` or customFields endpoint. Delete row → archive (`idClosed=true`) by default; hard delete as a secondary/confirmed action.
- Row click → right-side detail panel (`expanded-sidebar.png`): editable title, Members, Created By (read-only), Status, "+ Add a property", description, attachments, comments feed.

## 9. Promote page → workspace

- Every page (List) normally lives nested under some Board. An "options" menu at the top of a page offers **"Turn into workspace"**.
- Mechanism: create a new Board, then move the List into it via `PUT /1/lists/{id}/idBoard=<newBoardId>` (Trello supports moving a list, with all its cards, across boards natively). The page now stands alone in the sidebar as its own workspace root instead of being nested under its previous parent.
- This is a one-way promotion in v1 (no "demote back into a page" yet — open question below).

## 10. Sharing / public pages

- Trello only supports visibility at the **Board** level (`permissionLevel`: private / workspace / public) — there is no native way to make a single List public while its siblings stay private.
- Therefore: **Share** is only enabled for pages that are already workspace-level (their own Board). Clicking Share sets `PUT /1/boards/{id}/prefs/permissionLevel=public` and surfaces the Trello public URL.
- For a nested page, **Share is disabled** with a prompt: "Promote to workspace to share this page" (explicit user action required — v1 does not silently auto-promote on Share click, to avoid surprising side effects).

## 11. Tech stack

- **Next.js** (App Router), **shadcn/ui**, **Tailwind v4**, **Geist** font (Google Fonts).
- **Icons:** Hugeicons (`@hugeicons/react` + free `@hugeicons/core-free-icons`), not lucide-react, for anything we render ourselves. Some shadcn primitives ship with a lucide icon baked into the generated component (e.g. `sheet.tsx`'s close button) — swap those to Hugeicons whenever touched.
- **Theme:** Notion-style — dark default (`#191919`-ish bg, off-white text, hairline borders, minimal shadow), light mode toggle mirroring Notion's off-white.
- No app database — a thin Next.js API layer only proxies/holds the Trello token server-side.

### Routing (as implemented)

Until the block-based page canvas (§6/§7) exists, each page is its own route rather than a client-side view switch:

- `/` — resolves the signed-in user's boards and redirects to the first one; shows an empty state if the account has no boards.
- `/b/[boardId]` — resolves that board's lists and redirects to the first one; shows an empty state if the board has no lists.
- `/b/[boardId]/l/[listId]` — the actual page: sidebar (boards + lists) plus the active list's cards rendered as a table.
- `/api/cards/[cardId]` (GET/PATCH/DELETE), `/api/cards/[cardId]/comments` (POST), `/api/lists/[listId]/cards` (POST) — JSON endpoints the client-side table/detail-sheet call directly, so the Trello key/token never reach the browser.

This routing shape is intentionally simple (one table per list) and will need rethinking once §6's block canvas replaces "list = table" with "list = arbitrary block sequence."

## 12. Non-goals for v1

- No real-time multi-user sync (no websockets/webhooks yet).
- Single level of sub-page nesting workflow is the focus; deep multi-level nesting should fall out of the same mechanism but isn't specifically tested for v1.
- No permissions model beyond what Trello itself enforces (and the board-level-only sharing constraint above).
- Google login is UI-only (disabled), not functional.
- Multi-select / URL / Phone / Email / Relation / Formula / Rollup / Button as *table properties* — excluded (see §8). Note: URL and image ARE covered as their own block types (§4), just not as a table column type.
- "Demote" a workspace back into a nested page — not in v1.

## 13. Open questions (revisit later, not blocking v1 start)

- Block-type storage: hidden marker in `desc` (proposed default) vs. Label vs. Custom Field — confirm before building the block renderer, since it's foundational.
- Should "+ New Page" from the sidebar always attach to the current default board, or should the very first landing page also offer "start blank" vs. "import my existing Trello board" explicitly?
- Auto-promote-and-share vs. explicit "promote first" prompt for sharing a nested page — currently spec'd as explicit; revisit if it feels like too much friction.
- Do we ever need multi-level "demote," reordering pages across boards, or moving a page between two *different* parent pages?
