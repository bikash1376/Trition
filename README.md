# DaSpace

A Notion-like workspace UI backed entirely by Trello. There is no app database — every page, table, and block is a real Trello list/card/label under the hood. See [`SPEC.md`](./SPEC.md) for the full design and [`CHECKLIST.md`](./CHECKLIST.md) for current build status.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind v4
- shadcn/ui
- Geist / Geist Mono (via `next/font/google`)
- Auth: Trello OAuth1.0a token flow (no app-owned accounts). Google is present in the UI but disabled — no backend for it yet.

## Getting started

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Trello API key

1. Go to [trello.com/power-ups/admin](https://trello.com/power-ups/admin) → New → API Key.
2. Copy the **API Key** into `TRELLO_API_KEY` in `.env.local`.
3. Set `NEXT_PUBLIC_APP_URL` to whatever URL the app is running on (defaults to `http://localhost:3000`). This is used to build the Trello OAuth `return_url`, so it must match where the app is actually being served for login to work.
4. In the Trello Power-Up admin portal, make sure `http://localhost:3000` (or your deployed URL) is allowed as an origin for the API key.

The API key and secret should never be committed — `.env*` is already gitignored.

## Auth flow

DaSpace uses Trello's OAuth1.0a **token** flow, not a full 3-legged OAuth exchange, so no client secret is needed to log a user in:

1. `/login` → "Continue with Trello" links to `/api/auth/trello/authorize`.
2. That route redirects to Trello's `/1/authorize` endpoint with `response_type=token`.
3. Trello redirects back to `/auth/trello/callback#token=...` — the token arrives in the URL **fragment**, so it never touches the server directly.
4. The callback page (client-side) reads the fragment and POSTs the token to `/api/auth/trello/session`, which stores it in an httpOnly cookie.
5. Every server-side Trello API call reads the token from that cookie via `src/lib/trello/session.ts`.

## Project layout

```
src/
  app/
    login/                    login screen
    auth/trello/callback/     client-side OAuth callback (reads the token fragment)
    api/auth/                 route handlers: authorize, session, logout
    page.tsx                  entry point — redirects to /login if not authenticated
  components/
    shell/                    sidebar + app shell
    ui/                       shadcn/ui components
    icons.tsx                 provider + brand marks
  lib/
    trello/                   env helpers, cookie/session helpers, (Trello API client to come)
```

## Status

Auth, theming, and the base app shell are in place; board/page/card syncing against the real Trello API is not built yet (needs a live API key to develop against). See `CHECKLIST.md` for the phase-by-phase plan.
