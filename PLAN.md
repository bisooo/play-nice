# PLAN.md

Lean status doc; full history is in HISTORY.md.

## Current status

- **Build:** `npm ci`, `tsc --noEmit`, `next build` pass on `74910ee` (2024-10-13); lint has 2 warnings.
- **Login:** fixed in code (2026-09-29), not yet verified against a real Spotify app. `User.email` is now optional (Spotify dev mode no longer returns it); token refresh uses `expires_in` and keeps rotated refresh tokens. Needs `npx prisma db push` so the old unique index on `email` is dropped.
- **Cloud dev login:** `/api/dev/login` + `scripts/spotify-refresh-token.mjs` working and verified end to end with B's real account (2026-09-30): sign-in, sync, dashboard, expiry refresh. Spotify did not rotate the refresh token on 3 refreshes. axios bumped to 1.20 (old one couldn't reach Spotify through the cloud proxy).
- **Home / currently playing:** works signed in via dev login (nothing was playing, so the album-colour background wasn't exercised).
- **Profile + top-items sync:** verified via dev login 2026-09-30 (35–50 artists, 50 tracks per range stored).
- **Dashboard:** verified via dev login 2026-09-30; top 10 per tab matches the DB. `popularity` is now always null. Top items sync automatically (2026-09-30): every signed-in page load asks the server to sync, which only runs if data is over 24h old (atomic claim on `lastTopItemsUpdate`, released on failure). The dashboard waits for that before reading, and reads straight from the DB (localStorage cache removed). Update Data button removed.
- **Sampler:** removed 2026-09-30 (page, API routes, components, nav link, home-page FAQ). Its Spotify endpoints are gone for dev-mode apps; re-confirmed with real calls that day.

## Data model

MongoDB via Prisma. `User` (spotifyId unique, email, name, accessToken, refreshToken, lastTopItemsUpdate) → `TopArtist` / `TopTrack` (spotifyId, name, imageUrl, popularity, genres/artistName/albumName, timeRange SHORT/MEDIUM/LONG, rank), unique on `(userId, spotifyId, timeRange)`. Sync replaces a user's items per time range in a transaction.

## Auth / access control summary

NextAuth v4 Spotify provider, JWT sessions. Scopes: `user-read-email user-read-currently-playing user-library-read user-top-read`. Tokens stored in the JWT and (plaintext) in `User`. Every API route checks `getServerSession`. Refresh happens in the `jwt` callback a minute before expiry. Known gaps: `accessToken` is still on the client session (violates hard rule 1; fix by reading it server-side with `getToken` instead of the session); tokens unencrypted at rest.

## Scope / build order

1. ~~Get login working in code~~ (done 2026-09-29) → verify with a real Spotify app; move `accessToken` off the client session.
2. ~~Docs in repo~~ (done 2026-09-29).
3. Dependency upgrades: latest Next 14.2.x first; then decide on Next 15/16 + Auth.js v5, Prisma 6. Drop unused `@vercel/kv`, `@shadcn/ui`.
4. ~~Sampler decision~~ (removed 2026-09-30).
5. Smoke tests (Playwright) + GitHub Actions for lint/typecheck/build.

## Roadmap (agreed order)

Not agreed yet; proposed order is Scope 1 → 5 above.

## Open/Next

- [x] B: run `node scripts/spotify-refresh-token.mjs` locally and add the printed `DEV_SPOTIFY_REFRESH_TOKEN` to the cloud environment's env vars (done 2026-09-30; redo ~2027-03).
- [x] Verify cloud dev login end to end with the real token (done 2026-09-30; see HISTORY.md).
- [ ] Not verified: the album-colour background on the home page (needs a track playing on B's account during a check).
- [ ] B: confirm the Spotify-app owner account has Premium (required for dev mode since 2026-03).
- [ ] B: add `http://127.0.0.1:3000/api/auth/callback/spotify` (and the prod URL) as redirect URIs in the Spotify dashboard.
- [x] B: check the MongoDB Atlas cluster is still alive (was paused; resumed 2026-09-30).
- [x] Production sign-in works on https://play-nice.vercel.app (B confirmed 2026-09-30 after the Atlas resume).
- [ ] B: re-authorise the Vercel connector for the bisooos-projects team (runtime logs, env vars and project settings return 403).
- [x] B: decide the Sampler's fate (removed 2026-09-30).
- [ ] B: run `npx prisma db push` against the real DB (drops the old unique index on `email`; otherwise a second user without email collides).
- [ ] Not verified: signed-in flows end to end, including token refresh after an hour (needs a working Spotify app + DB).
- [ ] Move `accessToken` off the client session (hard rule 1).
- [ ] Not verified: auto-sync on production (B: open the dashboard on play-nice.vercel.app; your data should be from today).
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
- Save short-term top 50 as a playlist (`/playlists/{id}/items`).
- Consider Postgres if time-series history grows.

## Environment notes

- Use `127.0.0.1:3000`, never `localhost`, for local auth.
- Dev mode: max 5 users, each added in the Spotify dashboard; owner needs Premium.
- The sync only runs if `lastTopItemsUpdate` is over 24h old; set it back in the DB to force one when testing.
- Local Mongo must run as a replica set for Prisma transactions.

## Deployment

Vercel project `play-nice` (team bisooos-projects), https://play-nice.vercel.app. Pushing `main` deploys to production (Git link repaired 2026-09-30; nothing had deployed since 2024-10-13). Git flow: B chose pushing straight to `main` (2026-09-29). Env vars needed there: the five in `.env.example`.

## Verification plan

Every round: `npx tsc --noEmit`, `npm run lint`, `npm run build`. UI: Playwright MCP against `next build && next start`, logged-out paths automated, signed-in paths with a real test account (manual) until a session stub exists. API routes: confirm 401 without a session.
