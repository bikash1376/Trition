# Trition

A Notion-like workspace UI backed entirely by Trello. There is no app database — every page, table, and block is a real Trello list/card/label under the hood. See [`SPEC.md`](./SPEC.md) for the full design and [`CHECKLIST.md`](./CHECKLIST.md) for current build status.

> Internally, the app still creates a Trello list named **`DaSpace`** as the hidden "home" list for every board (see `HOME_LIST_NAME` in `src/lib/trello/blocks.ts`) — that's a stable identifier already baked into existing users' boards, not a rebrand miss. Everywhere the app is actually *displayed*, it's Trition.

## Stack

- Next.js 16 (App Router) + TypeScript, React 19
- Tailwind v4
- shadcn/ui (hand-adapted for [Base UI](https://base-ui.com), not Radix — this project has no shadcn CLI wired up)
- Geist / Geist Mono + Yesteryear (login/sidebar wordmark script font), via `next/font/google`
- Hugeicons (`@hugeicons/react` + free `@hugeicons/core-free-icons`) for icons — not lucide-react
- `motion` (framer-motion) for the sidebar brand shimmer
- Auth: Trello OAuth1.0a token flow (no app-owned accounts). Google is present in the UI but disabled — no backend for it yet.

## Getting started

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3211](http://localhost:3211). Trition runs on a dedicated port (3211) instead of the default 3000, so it doesn't collide with other local Next.js projects — see `package.json`'s `dev` script.

## Trello API key

1. Go to [trello.com/power-ups/admin](https://trello.com/power-ups/admin) → New → API Key.
2. Copy the **API Key** into `TRELLO_API_KEY` in `.env.local`.
3. Set `NEXT_PUBLIC_APP_URL` to whatever URL the app is running on (defaults to `http://localhost:3211`). This is used to build the Trello OAuth `return_url`, so it must match where the app is actually being served for login to work.
4. In the Trello Power-Up admin portal, make sure `http://localhost:3211` (or your deployed URL) is allowed as an origin for the API key.

The API key and secret should never be committed — `.env*` is already gitignored.

## Auth flow

Trition uses Trello's OAuth1.0a **token** flow, not a full 3-legged OAuth exchange, so no client secret is needed to log a user in:

1. `/login` → "Continue with Trello" links to `/api/auth/trello/authorize`.
2. That route redirects to Trello's `/1/authorize` endpoint with `response_type=token` (the consent screen shows "Trition" as the requesting app name).
3. Trello redirects back to `/auth/trello/callback#token=...` — the token arrives in the URL **fragment**, so it never touches the server directly.
4. The callback page (client-side) reads the fragment and POSTs the token to `/api/auth/trello/session`, which stores it in an httpOnly cookie.
5. Every server-side Trello API call reads the token from that cookie via `src/lib/trello/session.ts`.
6. If Trello ever rejects that token (401), `withAuthGuard()` sends the user to `/api/auth/trello/expire`, which clears the cookie and redirects to `/login`.
7. `/login` itself redirects to `/` if a valid session cookie is already present.

## How the Notion-like model maps to Trello

There's no app database — everything is derived live from Trello, using a few "hidden metadata" conventions so the app can store more structure than raw Trello objects give you:

| Trition concept | Trello backing |
| --- | --- |
| Workspace | Board |
| Page | List |
| Block (text/page-link/table-link/bookmark/image) | Card, with a type marker hidden at the start of `desc` (`src/lib/trello/blocks.ts`) |
| Table row | A plain card in a list that isn't marked as a block |
| Custom table column | A JSON schema stored on a hidden sentinel card per list (`src/lib/trello/columns.ts`), values stored as a hidden marker prepended to each row card's `desc` |
| Cover image | A hidden sentinel card in the workspace's home list, holding the attachment id + configured height |
| Workspace settings (e.g. "show Last Edited column") | A hidden marker on the **board's own `desc` field** (`src/lib/trello/board-settings.ts`) — workspace-wide, not per-list |
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

## Request-volume / rate-limit notes

Trello's real limit is **100 requests / 10s per token** (~10/s sustained). The app layers two caches to stay under that:

- Server-side in-memory TTL cache (`src/lib/trello/cache.ts`), per Node process — fine for `next dev`/single-instance `next start`, **not** shared across multiple serverless instances if ever deployed somewhere like Vercel with concurrent instances.
- Client-side `localStorage` cache for a couple of read-heavy, slow-changing fetches (e.g. board labels in the card detail sheet).

The "Last Edited By" table column (per-row, N+1 Trello Actions calls) is the priciest read in the app; it can be turned off per-workspace in **Board Settings → App settings** to cut the cost on large tables.

## Status

Auth, theming, the block-based page canvas, tables (built-in + fully custom columns), attachments, comments, invites, board settings, and a persistent app shell are all in place. See `CHECKLIST.md` for the full phase-by-phase breakdown and what's still open.
