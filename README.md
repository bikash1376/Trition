# DaSpace

A Notion-like workspace UI backed entirely by Trello. There is no app database — every page, table, and block is a real Trello list/card/label under the hood. See [`SPEC.md`](./SPEC.md) for the full design and [`CHECKLIST.md`](./CHECKLIST.md) for current build status.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind v4
- shadcn/ui
- Geist / Geist Mono (via `next/font/google`)
- Hugeicons (`@hugeicons/react` + free `@hugeicons/core-free-icons`) for icons — not lucide-react
- Auth: Trello OAuth1.0a token flow (no app-owned accounts). Google is present in the UI but disabled — no backend for it yet.

## Getting started

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3211](http://localhost:3211). DaSpace runs on a dedicated port (3211) instead of the default 3000, so it doesn't collide with other local projects — see `package.json`'s `dev` script.

## Trello API key

1. Go to [trello.com/power-ups/admin](https://trello.com/power-ups/admin) → New → API Key.
2. Copy the **API Key** into `TRELLO_API_KEY` in `.env.local`.
3. Set `NEXT_PUBLIC_APP_URL` to whatever URL the app is running on (defaults to `http://localhost:3211`). This is used to build the Trello OAuth `return_url`, so it must match where the app is actually being served for login to work.
4. In the Trello Power-Up admin portal, make sure `http://localhost:3211` (or your deployed URL) is allowed as an origin for the API key.

The API key and secret should never be committed — `.env*` is already gitignored.

## Auth flow

DaSpace uses Trello's OAuth1.0a **token** flow, not a full 3-legged OAuth exchange, so no client secret is needed to log a user in:

1. `/login` → "Continue with Trello" links to `/api/auth/trello/authorize`.
2. That route redirects to Trello's `/1/authorize` endpoint with `response_type=token`.
3. Trello redirects back to `/auth/trello/callback#token=...` — the token arrives in the URL **fragment**, so it never touches the server directly.
4. The callback page (client-side) reads the fragment and POSTs the token to `/api/auth/trello/session`, which stores it in an httpOnly cookie.
5. Every server-side Trello API call reads the token from that cookie via `src/lib/trello/session.ts`.
6. If Trello ever rejects that token (401), `withAuthGuard()` sends the user to `/api/auth/trello/expire`, which clears the cookie and redirects to `/login`.
7. `/login` itself redirects to `/` if a valid session cookie is already present.

## Routing

No app database, so pages are real routes rather than a client-side view switch:

- `/` — redirects to the user's first board, or shows an empty state if they have none.
- `/b/[boardId]` — redirects to that board's first list, or shows an empty state if it has none.
- `/b/[boardId]/l/[listId]` — the actual page: sidebar (boards + lists) plus that list's cards as a table.
- `/api/cards/[cardId]`, `/api/cards/[cardId]/comments`, `/api/lists/[listId]/cards` — JSON endpoints the table/detail-sheet call client-side; the Trello key/token never reach the browser.

## Project layout

```
src/
  app/
    login/                       login screen
    auth/trello/callback/        client-side OAuth callback (reads the token fragment)
    api/auth/                    route handlers: authorize, session, logout, expire
    api/cards/[cardId]/          card detail (GET/PATCH/DELETE) + comments (POST)
    api/lists/[listId]/cards/    create card (POST)
    b/[boardId]/                 board → redirects to its first list
    b/[boardId]/l/[listId]/      the table page for one list
    page.tsx                     entry point — redirects to the first board or /login
  components/
    shell/                       sidebar + app shell
    table/                       card table, detail sheet, avatar stack
    ui/                          shadcn/ui components
    icons.tsx                    provider + brand marks (not Hugeicons — real logos)
  lib/
    trello/                      env, session/cookie helpers, API client, types, auth guard
```

## Status

Auth, theming, real board/list/card data, and a working table + card detail panel are in place. Not yet built: the block-based slash-command page editor (pages currently render as one table per list, not an arbitrary block canvas), custom properties, attachments, and workspace promotion/sharing. See `CHECKLIST.md` for the full phase-by-phase breakdown.
