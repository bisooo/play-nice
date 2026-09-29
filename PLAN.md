# PLAN.md

Lean status doc; full history is in HISTORY.md.

## Current status

- **Build:** `npm ci`, `tsc --noEmit`, `next build` pass on `74910ee` (2024-10-13); lint has 2 warnings.
- **Login:** broken. Spotify dev mode stopped returning `email` (2026-03); `User.email` is required + unique, so the user upsert in the NextAuth `jwt` callback throws.
- **Home / currently playing:** code fine; blocked on login.
- **Profile + top-items sync:** code fine apart from the token-refresh bug; blocked on login. Shows a token prefix in the UI (remove).
- **Dashboard:** code fine; blocked on login. `popularity` is now always null.
- **Sampler (Record Digger, Record Analysis):** dead. `/recommendations`, `/audio-features` and `preview_url` removed for dev-mode apps (2024-11).

## Data model

MongoDB via Prisma. `User` (spotifyId unique, email, name, accessToken, refreshToken, lastTopItemsUpdate) → `TopArtist` / `TopTrack` (spotifyId, name, imageUrl, popularity, genres/artistName/albumName, timeRange SHORT/MEDIUM/LONG, rank), unique on `(userId, spotifyId, timeRange)`. Sync replaces a user's items per time range in a transaction.

## Auth / access control summary

NextAuth v4 Spotify provider, JWT sessions. Scopes: `user-read-email user-read-currently-playing user-library-read user-top-read`. Tokens stored in the JWT and (plaintext) in `User`. Every API route checks `getServerSession`. Known gaps: `refreshToken` exposed on the client session; tokens unencrypted at rest; `pages.signIn` points at non-existent `/login`.

## Scope / build order

1. Get login working (email optional, identity by spotifyId; `expires_in` + refresh rotation; redirect URI `127.0.0.1`; drop refreshToken from client session).
2. Docs in repo: CLAUDE.md, PLAN.md, HISTORY.md, README, `.env.example`, `docs/spotify-api.md`, `.mcp.json`.
3. Dependency upgrades: latest Next 14.2.x first; then decide on Next 15/16 + Auth.js v5, Prisma 6. Drop unused `@vercel/kv`, `@shadcn/ui`.
4. Sampler decision (remove vs rebuild on another audio-features source).
5. Smoke tests (Playwright) + GitHub Actions for lint/typecheck/build.

## Roadmap (agreed order)

Not agreed yet; proposed order is Scope 1 → 5 above.

## Open/Next

- [ ] B: confirm the Spotify-app owner account has Premium (required for dev mode since 2026-03).
- [ ] B: add `http://127.0.0.1:3000/api/auth/callback/spotify` (and the prod URL) as redirect URIs in the Spotify dashboard.
- [ ] B: check the MongoDB Atlas cluster is still alive (free tiers pause/delete when idle).
- [ ] B: decide the Sampler's fate.
- [ ] B: decide git flow for cloud sessions (push to `main` vs PRs).
- [ ] Not verified: signed-in flows end to end (needs a working Spotify app + DB).

## Future ideas

- Daily snapshots (Vercel Cron) of top items + recently played → rank movement, rising artists, own year-in-review.
- Rank-change dashboard (deltas across time ranges, "all-time staples").
- Genre map over time (if artist `genres` still returned; verify).
- Listening clock heatmap from recently-played timestamps.
- Sampler replacement via third-party audio features by ISRC, or LLM "dig deeper" suggestions resolved via search.
- Shareable OG image cards in the extracted album palette.
- Compare two users' top artists.
- Save short-term top 50 as a playlist (`/playlists/{id}/items`).
- Consider Postgres if time-series history grows.

## Environment notes

- Use `127.0.0.1:3000`, never `localhost`, for local auth.
- Dev mode: max 5 users, each added in the Spotify dashboard; owner needs Premium.
- `useClientCache` holds dashboard data in localStorage for 24h; clear it when testing.
- Local Mongo must run as a replica set for Prisma transactions.

## Deployment

Assumed Vercel (v0 origin); project name, URL and whether `main` auto-deploys are unconfirmed. Env vars needed there: the five in `.env.example`.

## Verification plan

Every round: `npx tsc --noEmit`, `npm run lint`, `npm run build`. UI: Playwright MCP against `next build && next start`, logged-out paths automated, signed-in paths with a real test account (manual) until a session stub exists. API routes: confirm 401 without a session.
