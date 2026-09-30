# PLAN.md

Lean status doc; full history is in HISTORY.md.

## Current status

- **Build:** `npm ci`, `tsc --noEmit`, `next build` pass on `74910ee` (2024-10-13); lint has 2 warnings.
- **Owner token:** `scripts/spotify-refresh-token.mjs` prints `SPOTIFY_REFRESH_TOKEN` (B's; set in Vercel and the cloud env 2026-09-30). Spotify did not rotate the refresh token on 3 refreshes. axios bumped to 1.20 (old one couldn't reach Spotify through the cloud proxy).
- **Home / currently playing:** public, B's live track. Layout (2026-09-30): exactly one screen tall, never scrolls (even with an FAQ answer open); the card sizes itself to the space left (container query), on phones a wide frosted card (336px max) around a 240px cover that shrinks only when height runs out; on larger screens the cover fills the card, never below 11rem; track/artist/album truncate to one line. Now playing polls every 5s while the tab is visible (none when hidden), checks again ~1s after the current track should end, honours Retry-After on 429, only re-renders when the track changes, preloads the cover and crossfades; the background lines fade to the new palette. Album colours checked only with mocked tracks and covers (nothing was playing).
- **Navbar (2026-09-30):** white logo left, colored logo right (both link home), links centred between them.
- **No login (2026-09-30):** Spotify dev mode caps an app at 5 allow-listed users, allowlist edits have no API, and extended quota needs a registered business with 250k+ monthly users, so B chose to drop login: the app shows B's listening to everyone. The server uses `SPOTIFY_REFRESH_TOKEN` (`src/lib/owner.ts`), keeps the access token on B's `User` row, and every route is public. NextAuth, `/profile`, the login UI and `/api/dev/login` are gone. Card reveals are per visitor (localStorage, key no longer has a user id, so B's old reveal progress reset).
- **Top-items sync:** verified 2026-09-30 with B's token (35–50 artists, 50 tracks per range stored).
- **On Repeat (was Dashboard):** renamed 2026-09-30, then split the same day into ARTISTS ON REPEAT (`/on-repeat/artists`) and TRACKS ON REPEAT (`/on-repeat/tracks`) nav tabs sharing a layout that keeps the time range and data; `/on-repeat` redirects to artists (temporary); `/dashboard` removed (404). All three time ranges are preloaded into memory right after the page-load sync, so switching tabs/ranges or coming back from home shows no loading; before that, blurred placeholder cards show instead of a spinner. On laptops (lg+) the 2×5 grid is capped by viewport height so neither page scrolls (checked 1024×640 to 1920×1080); phones scroll. Verified 2026-09-30 with B's data; top 10 per tab matches the DB. `popularity` is now always null. Top items sync automatically (2026-09-30): every page load asks the server to sync, which only runs if data is over 24h old (atomic claim on `lastTopItemsUpdate`, released on failure). The dashboard waits for that before reading, and reads straight from the DB (localStorage cache removed; since 2026-09-30 an in-memory preload refetched after each sync). Update Data button removed.
- **Card reveals (gamified 2026-09-30):** saved in localStorage per user, list and time range (`src/hooks/useReveals.ts`). A card is face-down until revealed (hover, click or tap) at its current rank; after a sync, new entries and rank changes go face-down again and show NEW / ↑n / ↓n once flipped. The first visit to a deck is the baseline (no badges). Reveals don't follow you across devices (DB storage is a future idea).
- **Sampler:** removed 2026-09-30 (page, API routes, components, nav link, home-page FAQ). Its Spotify endpoints are gone for dev-mode apps; re-confirmed with real calls that day.

## Data model

MongoDB via Prisma. `User` (spotifyId unique, email, name, accessToken, refreshToken, lastTopItemsUpdate) → `TopArtist` / `TopTrack` (spotifyId, name, imageUrl, popularity, genres/artistName/albumName, timeRange SHORT/MEDIUM/LONG, rank), unique on `(userId, spotifyId, timeRange)`. Sync replaces a user's items per time range in a transaction.

## Access control summary

No login. `SPOTIFY_REFRESH_TOKEN` (env) is B's refresh token; `src/lib/owner.ts` refreshes the access token a minute before expiry and stores it (plaintext) on B's `User` row, found by that refresh token. Scopes the token was minted with: `user-read-email user-read-currently-playing user-library-read user-top-read`. All routes are public and serve only B's data; none returns a token.

## Scope / build order

1. ~~Get login working~~ (replaced 2026-09-30: no login, B's data public).
2. ~~Docs in repo~~ (done 2026-09-29).
3. Dependency upgrades: latest Next 14.2.x first; then decide on Next 15/16 + Auth.js v5, Prisma 6. Drop unused `@vercel/kv`, `@shadcn/ui`.
4. ~~Sampler decision~~ (removed 2026-09-30).
5. Smoke tests (Playwright) + GitHub Actions for lint/typecheck/build.

## Roadmap (agreed order)

Not agreed yet; proposed order is Scope 1 → 5 above.

## Open/Next

- [x] Now playing CDN cache works on Vercel (second request `x-vercel-cache: HIT`, 2026-09-30).
- [ ] B: every ~6 months (next ~2027-03) rerun `scripts/spotify-refresh-token.mjs` and update `SPOTIFY_REFRESH_TOKEN` in Vercel (redeploy) and the cloud env. Until then the site shows "isn't connected to Spotify".
- [ ] B: remove `NEXTAUTH_SECRET`, `NEXTAUTH_URL` and `DEV_SPOTIFY_REFRESH_TOKEN` from Vercel and the cloud env (no longer read).

- [x] B: run `node scripts/spotify-refresh-token.mjs` locally and add the printed `DEV_SPOTIFY_REFRESH_TOKEN` to the cloud environment's env vars (done 2026-09-30; redo ~2027-03).
- [x] Verify cloud dev login end to end with the real token (done 2026-09-30; see HISTORY.md).
- [ ] Not verified: the album-colour background with a real playing track (checked 2026-09-30 with a mocked track + cover in Playwright; needs a track playing on B's account, and container Chromium can't load i.scdn.co).
- [ ] B: confirm the Spotify-app owner account has Premium (required for dev mode since 2026-03).
- [x] B: check the MongoDB Atlas cluster is still alive (was paused; resumed 2026-09-30).
- [x] Production sign-in works on https://play-nice.vercel.app (B confirmed 2026-09-30 after the Atlas resume).
- [ ] B: re-authorise the Vercel connector for the bisooos-projects team (runtime logs, env vars and project settings return 403).
- [x] B: decide the Sampler's fate (removed 2026-09-30).
- [ ] Not verified: a real Spotify 429 on now playing (Retry-After backoff tested only by reading the code path).
- [ ] Not verified: the owner token's hourly refresh from a stored, expired access token (first refresh verified 2026-09-30; the expiry path is the same code).
- [ ] Not verified: auto-sync on production (B: open On Repeat on play-nice.vercel.app; your data should be from today).
- [x] ~~Key the dashboard's localStorage cache per user~~ (cache removed 2026-09-30).
- [ ] Fix the lint warning (userManager default export).

## Future ideas

- Daily snapshots (Vercel Cron, using stored refresh tokens) of top items + recently played → rank movement, rising artists, own year-in-review.
- Rank-change dashboard (deltas across time ranges, "all-time staples").
- Genre map over time (if artist `genres` still returned; verify).
- Listening clock heatmap from recently-played timestamps.
- Sampler replacement via third-party audio features by ISRC, or LLM "dig deeper" suggestions resolved via search.
- Shareable OG image cards in the extracted album palette.
- Compare two users' top artists.
- Store card reveals in the DB so progress follows you across devices.
- Save short-term top 50 as a playlist (`/playlists/{id}/items`).
- Consider Postgres if time-series history grows.

## Environment notes

- Use `127.0.0.1:3000`, never `localhost`, for local auth.
- Dev mode: max 5 users, owner needs Premium. Irrelevant now that only B's token is used.
- The sync only runs if `lastTopItemsUpdate` is over 24h old; set it back in the DB to force one when testing.
- Local Mongo must run as a replica set for Prisma transactions.

## Deployment

Vercel project `play-nice` (team bisooos-projects), https://play-nice.vercel.app. Pushing `main` deploys to production (Git link repaired 2026-09-30; nothing had deployed since 2024-10-13). Git flow: B chose pushing straight to `main` (2026-09-29). Env vars needed there: the five in `.env.example`.

## Verification plan

Every round: `npx tsc --noEmit`, `npm run lint`, `npm run build`. UI: Playwright MCP against `next build && next start`, logged-out paths automated, signed-in paths with a real test account (manual) until a session stub exists. API routes: confirm 401 without a session.
