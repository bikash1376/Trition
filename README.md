# Trition

<img src="public/banner.png">

A Notion-like workspace UI using Trello as a headless database. No custom database or backend infra required — all your notes, pages, and components are stored directly in Trello.

> Internally, the app still creates a Trello list named **`DaSpace`** as the hidden "home" list for every board (see `HOME_LIST_NAME` in `src/lib/trello/blocks.ts`) — that's a stable identifier already baked into existing users' boards, not a rebrand miss. Everywhere the app is actually *displayed*, it's Trition.

## Stack

- Next.js 16 (App Router) + TypeScript, React 19
- Tailwind v4
- shadcn/ui (hand-adapted for [Base UI](https://base-ui.com), not Radix — this project has no shadcn CLI wired up)
- Geist / Geist Mono + Yesteryear (login/sidebar wordmark script font), via `next/font/google`
- Hugeicons (`@hugeicons/react` + free `@hugeicons/core-free-icons`) for icons — not lucide-react
- `motion` (framer-motion) for the sidebar brand shimmer
- Auth: Trello OAuth1.0a token flow (no app-owned accounts). Google is present in the UI but disabled — no backend for it yet.
- [Databuddy](https://www.databuddy.cc) for privacy-conscious analytics — optional, only mounts if `NEXT_PUBLIC_DATABUDDY_CLIENT_ID` is set

## Running locally / self-hosting

Trition has no database of its own and no app-owned user accounts — the only external dependency is a free Trello API key, so self-hosting is just "run the Next.js app somewhere and point it at itself."

1. **Clone and install**

   ```bash
   git clone https://github.com/bikash1376/trotion.git
   cd trotion
   npm install
   ```

2. **Get a Trello API key** — go to [trello.com/power-ups/admin](https://trello.com/power-ups/admin) → New → API Key, and copy the **API Key** shown (not the secret; the secret isn't required for this app's auth flow, see below).

3. **Configure env vars**

   ```bash
   cp .env.local.example .env.local
   ```

   | Variable | Required | Notes |
   | --- | --- | --- |
   | `TRELLO_API_KEY` | Yes | From step 2. Server-only — never sent to the browser. |
   | `TRELLO_API_SECRET` | No | Present in `.env.local.example` for completeness, but unused — the app uses Trello's OAuth1.0a **token** flow, which needs no client secret (see "Auth flow" below). |
   | `NEXT_PUBLIC_APP_URL` | Yes | The URL the app is actually served from, e.g. `http://localhost:3211` locally or `https://your-domain.com` in production. Used to build the Trello OAuth `return_url` — **must exactly match** where the app is running, or login will silently fail to return. |
   | `NEXT_PUBLIC_DATABUDDY_CLIENT_ID` | No | [Databuddy](https://www.databuddy.cc) analytics client id. Leave blank to skip analytics entirely — the tracker only mounts if this is set. |
   | `DEMO_TRELLO_TOKEN` | No | Token for a throwaway Trello account, powers the "Try now" demo login on `/login`. Leave blank to hide that button entirely. See "Demo mode" below. |

   `.env*` is already gitignored — never commit real keys.

4. **Allow your origin in Trello** — in the Power-Up admin portal for your API key, add `http://localhost:3211` (or your deployed `NEXT_PUBLIC_APP_URL`) as an allowed origin.

5. **Run it**

   ```bash
   npm run dev      # dev server, port 3211 (see package.json)
   # or, for a production build:
   npm run build
   npm run start
   ```

   Open [http://localhost:3211](http://localhost:3211). The dedicated port (3211 instead of 3000) exists so this project doesn't collide with other local Next.js projects on the default port.

**Deploying (e.g. Vercel, a VPS, a container):** the only two things that change from local are `NEXT_PUBLIC_APP_URL` (point it at your real domain, over `https://`) and re-allowing that new origin in the Trello Power-Up admin portal for your key. One real limitation to know about before deploying to a multi-instance/serverless platform: the server-side cache (`src/lib/trello/cache.ts`) is per-process in-memory, so it won't be shared across concurrent instances — see "Performance & optimizations" below.

## Auth flow

Trition uses Trello's OAuth1.0a **token** flow, not a full 3-legged OAuth exchange, so no client secret is needed to log a user in:

1. `/login` → "Continue with Trello" links to `/api/auth/trello/authorize`.
2. That route redirects to Trello's `/1/authorize` endpoint with `response_type=token` (the consent screen shows "Trition" as the requesting app name).
3. Trello redirects back to `/auth/trello/callback#token=...` — the token arrives in the URL **fragment**, so it never touches the server directly.
4. The callback page (client-side) reads the fragment and POSTs the token to `/api/auth/trello/session`, which stores it in an httpOnly cookie.
5. Every server-side Trello API call reads the token from that cookie via `src/lib/trello/session.ts`.
6. If Trello ever rejects that token (401), `withAuthGuard()` sends the user to `/api/auth/trello/expire`, which clears the cookie and redirects to `/login`.
7. `/login` itself redirects to `/` if a valid session cookie is already present.

### Demo mode ("Try now")

Optional, off by default. If `DEMO_TRELLO_TOKEN` is set, `/login` shows a "Try now" button next to the real Trello login. Clicking it:

1. `POST /api/auth/demo` — before anything else, if every board on the demo account has been idle for over an hour, they're all deleted (so the next visitor gets a genuinely empty workspace, not the last visitor's mess).
2. Sets the **same session cookie** the real login flow uses, just pointed at the demo account's token, and redirects to `/home` — from there it's the exact same app, no special-cased demo UI.

This is a single shared account, not one sandbox per visitor — concurrent demo visitors see the same boards. That's a deliberate simplification: real per-visitor isolation would mean either a separate Trello account per click (not possible without asking visitors to sign up, defeating the point) or building scoping logic so a shared account's boards can't leak between sessions, which is a lot of surface area for a "just let people poke around" button. See `.env.local.example` for how to mint the demo account's token — it's the same manual token-mint URL developers already use to get a Trello token without going through OAuth.

## How it works

Every request that touches Trello data goes: browser → a Next.js Route Handler under `src/app/api/**` → `src/lib/trello/client.ts` (which attaches the server-only API key + the caller's token and calls `api.trello.com` directly) → back to the browser as plain JSON. The Trello key and the user's token **never reach client-side JavaScript** — they live only in an httpOnly session cookie and server env vars. There's no database, no ORM, no migrations: Trello's own boards/lists/cards/labels/attachments/comments *are* the data model, read fresh (through a short-lived cache, see below) on every page load.

### How the Notion-like model maps to Trello

There's no app database — everything is derived live from Trello, using a few "hidden metadata" conventions so the app can store more structure than raw Trello objects give you:

| Trition concept | Trello backing |
| --- | --- |
| Workspace | Board |
| Page | List |
| Block (text/page-link/table-link/bookmark/image) | Card, with a type marker hidden at the start of `desc` (`src/lib/trello/blocks.ts`) |
| Table row | A plain card in a list that isn't marked as a block |
| Custom table column | A JSON schema stored on a hidden sentinel card per list (`src/lib/trello/columns.ts`), values stored as a hidden marker prepended to each row card's `desc` |
| Cover image | A hidden sentinel card in the workspace's home list, holding the attachment id + configured height |
| Workspace settings (e.g. "show Last Edited column", which lists back a Table block's own list) | A hidden marker on the **board's own `desc` field** (`src/lib/trello/board-settings.ts`) — workspace-wide, not per-list |
| "Home" (personal space) | A dedicated private board per user, `DaSpace Personal` |

Everywhere a marker is used, reads strip it before handing data to the client and writes re-merge it so an unrelated edit (e.g. changing a card's description) can never clobber the hidden metadata.

## Routing

- `/` — redirects to `/home` (personal space) always.
- `/home`, `/home/l/[listId]` — the personal space and its pages.
- `/b/[boardId]` — a workspace's home canvas (blocks + optional table, Invite/Members/Board Settings/"In lobby" activity in the header).
- `/b/[boardId]/l/[listId]` — a page inside a workspace.
- `src/app/(app)/layout.tsx` — shared shell (sidebar + `AppShell`) for all four routes above, so navigating between them doesn't remount the sidebar.
- `/api/**` — route handlers the client calls for every mutation and detail fetch; the Trello key/token never reach the browser.

## Project layout

```
src/
  app/
    (app)/                       shared layout + home/board/page routes (see Routing above)
    login/                       login screen (video intro → Trition wordmark)
    auth/trello/callback/        client-side OAuth callback (reads the token fragment)
    api/                         route handlers — auth, boards, lists, cards, blocks, columns, attachments
    layout.tsx, page.tsx         root layout + entry redirect
  components/
    shell/                       sidebar, app shell, board settings, invite, lobby/activity, about dialog
    blocks/                      block canvas + each block type's component
    table/                       card table, detail sheet, avatar stack, custom columns
    ui/                          shadcn/ui-style primitives (Base UI under the hood)
    better/                      small standalone effects (e.g. text shimmer)
    icons.tsx                    provider + brand marks (not Hugeicons — real logos)
  lib/
    trello/                      env, session/cookie helpers, API client + cache, block/column/settings marker codecs, types, auth guard
    lorem.ts, local-cache.ts, use-debounced-callback.ts
```

## Mobile & responsiveness

The sidebar collapses into an off-canvas drawer below the `md` breakpoint (`AppShell`), and every hover-only affordance (block edit/delete, column rename/delete, row delete, sidebar page delete) is also shown unconditionally below `md` — those actions used to be reachable only via `:hover`, which touch devices can't trigger. Canvas/table padding also steps down on small screens. See `CHECKLIST.md` for what's still unaudited.

## Performance & optimizations

Trello's real limit is **100 requests / 10s per token** (~10/s sustained), and every read in this app is a live Trello API call — so staying fast and under that limit is the same problem. What's in place today:

- **Two-layer caching.** Server-side in-memory TTL cache (`src/lib/trello/cache.ts`, `cached()`) in front of the read-heavy, slow-changing calls — `getMe`, `getMyBoards`, `getBoard`, `getBoardMembers`, `getBoardLabels`, `getBoardMemberships` (60s), `getCardCreator` (60min — never changes once set), `getCardLastEditor` (60s), `getBoardActions` for the "In lobby" feed (15s). Client-side `localStorage` cache on top of that for a couple of fetches the card detail sheet repeats often (e.g. board labels, 10min TTL). Known limitation: the server cache is per-Node-process in-memory, so it's not shared across concurrent serverless instances — fine for `next dev`/single-instance `next start`, worth revisiting before a multi-instance deploy.
- **Batched reads, not sequential ones.** Anywhere the app needs N related things (e.g. a table's per-row creator/last-editor), it's always `Promise.all(...)`, never an `await` in a loop — same wall-clock latency as one round trip's worth of waiting, not N.
- **A per-workspace cost lever.** The priciest read in the app is "Last Edited By" (one Trello Actions call per table row); it can be switched off in **Board Settings → App settings** on tables where that cost isn't worth it.
- **Optimistic UI everywhere a mutation doesn't need a fresh id back to render correctly.** Adding a table row, deleting a row/page/block, renaming, archiving, posting a comment, editing text — all update the screen immediately from the action you just took, then fire the real request in the background; only flows that need a real Trello-assigned id to route to (new page/table/attachment) wait on the response. This is why most actions in the app *feel* like 1–2 seconds even though nothing is instant: the UI isn't waiting on the network, the network is catching up to the UI.
- **Debounced writes.** Text edits (block content, card descriptions) batch into Trello after ~10s of idle typing or on blur, not on every keystroke — `src/lib/use-debounced-callback.ts`.

### What optimistic UI does *not* currently cover

The gap worth naming explicitly, since it's the natural next question: today, "optimistic" means the *UI* updates instantly, but the underlying `fetch()` call is still a fire-and-forget request over the current network connection. If the tab closes or the connection drops **before that request lands**, the change is lost from Trello's perspective even though the UI showed it as done. Nothing currently queues, retries, or persists a write that didn't make it out.

If that's worth closing, there are two different problems bundled in the ask, worth solving separately rather than jumping straight to a new backend service:

1. **Survive tab-close / lost connectivity for a single client.** This doesn't need a server at all — a durable local outbox (IndexedDB, since `localStorage` is too small/sync for this) that logs "pending Trello writes," replays them on reconnect/next launch via a service worker or a page-load flush, and reconciles or drops entries once Trello confirms. This is the right-sized fix for "I closed the tab mid-edit" and "my wifi dropped," and it's a purely client-side change — no new infrastructure, no hosting bill, no new moving part to operate.
2. **A durable, shared write queue with its own database that Trello is eventually consistent with** (Redis/BullMQ/RabbitMQ/Kafka + a Postgres/etc. system-of-record, writing to both and reconciling toward Trello) is a real architecture, not a feature — it turns "no app database, Trello is truth" into "app database is truth, Trello is a sync target," which is close to a rewrite of the read path too (every GET currently reads Trello live; a queue-backed write side without a matching read-side cache/store would leave reads stale relative to writes still sitting in the queue). It also adds real operational surface — a queue and a database to run, monitor, and pay for — for a project whose current scale (personal/small-team) may not need it yet.

**Recommendation:** do (1) first — it directly answers "don't lose my work if my tab closes," is a contained client-side change, and doesn't commit the project to running new infrastructure. Treat (2) as a deliberate, larger architectural decision to make later if/when this needs to run at a scale or reliability bar where "eventually queued to Trello" is worth the operational cost of a queue + a second database — not something to bolt on incidentally.

## Status

Auth, theming, the block-based page canvas, tables (built-in + fully custom columns), attachments, comments, invites, board settings, and a persistent app shell are all in place. See `CHECKLIST.md` for the full phase-by-phase breakdown and what's still open.
