# HISTORY.md

Append-only, one section per session, newest at the bottom. Never rewrite or reorder past entries.

Entry shape:
```
## <Feature/area> — <one-line scope>, complete and verified
What was built (files, decisions + why).
Bugs found and fixed (root cause, how confirmed).
Verified via <tool>: <flows exercised, DB/DOM checks>. Test data cleaned up.
Checks: typecheck / lint / build / tests.
Not verified: <item> — why, and who needs to check it.
```

## 2024 — original build with v0

Built in Aug–Oct 2024 (last commit `74910ee`, 2024-10-13): Spotify login, currently-playing card with ColorThief background, top-items sync to MongoDB, dashboard, Sampler (Record Digger via `/recommendations`, Record Analysis via `/audio-features`). See `git log` for detail.

## 2026-09-29 — Revival review and docs setup

What was done: reviewed the repo after ~2 years idle; drafted CLAUDE.md (hard rules, working guidelines ported from BOOKIE and adapted to Next 14 + NextAuth + Prisma/Mongo), PLAN.md, HISTORY.md, docs/spotify-api.md, .env.example, .mcp.json.
Findings (root causes, confirmed by reading code + Spotify docs):
- Login breaks: Spotify dev mode no longer returns `email` (2026-03-09); `User.email` is required + unique → upsert throws in `authOptions.ts` jwt callback.
- Sampler dead: `/recommendations`, `/audio-features`, `preview_url` removed for dev-mode apps (2024-11-27).
- Token refresh reads `expires_at` (`spotifyTokenManager.ts:27`); Spotify returns `expires_in` → no refresh after the first, 401s an hour later.
- `localhost` redirect URIs no longer accepted by Spotify.
Checks: `npm ci` ok, `tsc --noEmit` clean, `next build` ok, lint 2 warnings (RecordDigger exhaustive-deps, userManager anonymous default export).
Not verified: runtime login (no Spotify app credentials or DB in the session); Atlas cluster state; Vercel config.

## 2026-09-29 — Login fix, complete in code, not verified at runtime

What was built: `User.email` optional and no longer unique (`prisma/schema.prisma`), login upsert passes `profile.email ?? null` (`src/lib/authOptions.ts`). Token refresh computes expiry from `expires_in`, keeps a rotated `refresh_token`, refreshes 60s early, and writes tokens to the DB once (`src/lib/spotifyTokenManager.ts`). `refreshToken` removed from the client session; `session.error` exposed so the UI can react to a failed refresh. Removed `pages` config (`signIn` pointed at a missing `/login`). Profile page no longer prints a token prefix. Docs committed (CLAUDE.md, PLAN.md, HISTORY.md, README, docs/spotify-api.md, .env.example, .mcp.json). B chose pushing straight to `main`.
Checks: `tsc --noEmit` clean, `next build` ok, lint same 2 pre-existing warnings.
Not verified: real Spotify login and refresh (no credentials or DB in the cloud session); `prisma db push` against the real DB is B's to run.

## 2026-09-30 — Cloud dev login, complete and verified
What was built (2026-09-29, commits `b6a7aee`, `1456763`, `927cc7a`): `GET /api/dev/login` mints a normal NextAuth JWT session from env `DEV_SPOTIFY_REFRESH_TOKEN`, upserting the user like a real login; 404 unless the token is set, `VERCEL` is unset and NEXTAUTH_URL + DATABASE_URL are loopback (hard rule 6). `scripts/spotify-refresh-token.mjs` gets the token on B's machine (redo every ~6 months). `scripts/cloud-setup.sh` starts a throwaway Mongo replica set, installs deps and pushes the schema. Why: Spotify's login page can't be driven from a cloud container.
Bugs found and fixed: axios < 1.16.1 sent plain HTTP to the cloud egress proxy (405), so every Spotify call failed; bumped to 1.20.
Verified via Playwright (scripted, container Chromium) on `next build && next start` at 127.0.0.1:3000, throwaway Mongo: `/api/dev/login` redirects home with a session cookie; client session has no refresh token (still has `accessToken`, known gap); home shows "No track playing" (current-track 200 empty, nothing was playing); Profile "UPDATE DATA" → success dialog; DB has one user `bisooooo10` (email null) with 35/50/50 artists and 50/50/50 tracks for short/medium/long; dashboard top 10 artists and tracks on all three tabs match a direct DB query rank for rank; no horizontal overflow at 375px. Expiry refresh: a session with an expired access token was refreshed by the jwt callback (current-track 200, new token valid 60 min, cookie re-issued). Spotify did not rotate the refresh token on 3 refreshes (no "[dev-login] Spotify rotated" log line; re-issued cookie kept the same token). Test data is only in the throwaway container DB.
Checks: typecheck clean, lint 2 pre-existing warnings, build ok.
Not verified: album-colour background (nothing playing); album art images in the container browser (proxy CA not trusted by Chromium, ERR_CERT_AUTHORITY_INVALID); Playwright MCP expects a newer Chromium than the container has, so a node Playwright script with `executablePath: /opt/pw-browsers/chromium` was used instead.

## 2026-09-30 — Production sign-in 500, deploy fixed, sign-in retest pending
Root cause of the 500: production was still the 2024-10-13 build (`74910ee`); Vercel's GitHub app had lost permissions, so no push since 2024 deployed. Confirmed via the Vercel connector (deployment list) and the live profile chunk still containing the removed `TOKEN:` line. B refreshed the GitHub permissions; pushing `9f325e2` deployed in about a minute.
After deploy: `/api/auth/*` 200, `/api/user-insights` 401 signed out, sign-in redirects to Spotify and the prod redirect URI is accepted (curl). B's real login then hit `error=Callback`, which next-auth v4 raises when our `jwt` callback throws (Spotify token/profile failures give `OAuthCallback`), i.e. the Atlas upsert. B found the Atlas cluster paused and resumed it.
Checks: `next build` ok locally; no code changes.
Update: B confirmed production sign-in works after the resume.
Not verified: `prisma db push` against Atlas; Vercel runtime logs (connector 403 on the team scope).

## 2026-09-30 — Dashboard stale after Update Data, complete and verified
Bug: on production the dashboard kept showing B's 2024 top items after Update Data. Root cause: two caches that a sync never invalidated. `useClientCache` keeps each dashboard tab in localStorage for 24h (the first dashboard visit after sign-in cached the old 2024 rows), and `/api/user-insights` also held results in an in-memory `serverCache` for 1h per serverless instance. The sync itself worked.
Fix: Update Data clears the `userInsights_*` localStorage keys on any successful response (`clearClientCache`, `src/hooks/useUpdateUserTopItems.ts`); removed `serverCache` from `/api/user-insights` and deleted `src/lib/serverCache.ts` (per-instance, can't be invalidated). New hard rule 8 in CLAUDE.md.
Verified via Playwright (scripted, container Chromium) on `next build && next start`, throwaway Mongo, dev login as B: seeded 10 fake "OLD2024" artists/tracks per range with `lastTopItemsUpdate` 2024-10-13, opened the dashboard (old data shown and cached), pressed Update Data ("YOUR DATA HAS BEEN UPDATED!"), DB then had 0 old and 135 real artists. Before the fix the dashboard still showed OLD2024 after update and after reload (reproduced); after the fix it showed the real #1 (TUL8TE, matching the DB's MEDIUM_TERM rank 1). `/api/user-insights` still 401 signed out.
Checks: typecheck clean, lint 2 pre-existing warnings, build ok.
Not verified: production. B's browser still holds the cached 2024 data until pressing Update Data once after this deploys. `prisma db push` on Atlas still pending (not needed for this fix).

## 2026-09-30 — Automatic top-items sync, complete and verified
What was built: B picked sync-on-visit over a nightly Vercel Cron (no history is kept, so data only matters when viewed; no unattended prod job over stored refresh tokens). `TopItemsSyncProvider` in `SessionLayout` POSTs `/api/internal/updateUserTopItems` once per signed-in page load. The route claims the sync atomically (`updateMany` where `lastTopItemsUpdate` unset/null/over 24h old), so parallel tabs sync once; on failure it restores the old timestamp so the next visit retries. `useUserInsights` waits for the sync, then reads the DB directly (request-id guarded); `useClientCache`, `useUpdateUserTopItems`, `dialogUtils` and the Update Data button were removed. A cron for history snapshots stays in Future ideas.
Verified via Playwright (container Chromium, 375px) + `next start` + throwaway Mongo with dev login: empty DB → landing on home synced (2.7s, 135 artists / 150 tracks); dashboard top 3 matches DB. Data set 2 days old with a planted fake #1 → dashboard showed a spinner mid-sync, never the fake, then fresh data (fake gone in DB). 3 parallel POSTs on stale data → one `updated:true`, two `false`. Spotify made unreachable (second server with a dead HTTPS_PROXY) → 500, `lastTopItemsUpdate` restored, next POST synced. Profile shows only LOG OUT. Signed out → 401.
Checks: typecheck clean, lint 2 pre-existing warnings, build ok.
Not verified: production (B opens the dashboard after deploy).

## 2026-09-30 — Sampler removed, complete and verified
Confirmed dead first: with B's dev-login token, `GET /recommendations` returned 404, `/audio-features/{id}` and `/audio-analysis/{id}` 403, and `preview_url` was null on a track `GET /tracks/{id}` returned 200. B asked to remove it.
Removed: `/sampler` page, `/api/spotify/recommendations` and `/api/spotify/track-analysis`, Sampler/RecordDigger/RecordAnalysis/RecommendationList/TrackCard/ParameterControls/GenerateButton/ErrorAlert components, `useRetry`/`useAudioPlayback` hooks, `src/lib/constants.ts` (genres/markets), `src/types/spotifyTypes.ts` and the Sampler types, `getRecommendations`/`searchTrack`/`getAudioFeatures` from `SpotifyService`, the SAMPLER nav link and the "What's the Sampler?" home FAQ. Also the shadcn slider/scroll-area/separator/input/label/dropdown-menu components and their Radix packages, which only the Sampler used.
Verified via Playwright (scripted, container Chromium, 390px) on `next build && next start`, throwaway Mongo, dev login as B: home has no Sampler text and 2 FAQ items; signed-in nav links are `/`, `/dashboard`, `/profile`; dashboard renders; `/sampler` and both removed API routes return 404.
Checks: typecheck clean, lint 1 pre-existing warning (the RecordDigger one went with it), build ok.
Not verified: production after deploy (checked only locally).

## 2026-09-30 — Dashboard renamed to On Repeat, complete and verified
B asked for a catchier name now that it's the only tab; picked ON REPEAT over "What's on your playlist?" (the page shows most-played, not playlists, and a long label won't fit the phone nav). Nav link reads ON REPEAT, route moved `src/app/dashboard` → `src/app/on-repeat`, `/dashboard` permanently redirects (`next.config.mjs`). Home FAQ is now "WHAT'S ON REPEAT ?" / "Your most played artists and tracks, from the last few weeks to the past year" (B asked for short, non-techy copy). Component still named `Dashboard`.
Verified via Playwright (scripted, container Chromium, 375px) on `next build && next start`, throwaway Mongo, dev login as B: nav links `/`, `/on-repeat` (ON REPEAT), `/profile`; FAQ opens with the new text; `/dashboard` → 308 → `/on-repeat` with the link marked active and top artists/tracks rendered; no horizontal overflow.
Checks: typecheck clean, lint 1 pre-existing warning, build ok.
Not verified: production after deploy.

## 2026-09-30 — On Repeat split into artists/tracks, home spacing, complete and verified
B asked to split On Repeat so it doesn't scroll on a laptop, and to shrink the now-playing card on phones so the album-colour lines show. Picked two nav tabs with their own routes over one page with a toggle (B named them as tabs): ARTISTS ON REPEAT `/on-repeat/artists`, TRACKS ON REPEAT `/on-repeat/tracks`. `src/app/on-repeat/layout.tsx` + `src/components/OnRepeat.tsx` (replaces `Dashboard.tsx`) hold the time-range tabs and the insights fetch, so switching tabs keeps the range and doesn't refetch. `/on-repeat` redirects to artists (non-permanent), `/dashboard` 308s to artists. At lg+ grid columns are `minmax(0, var(--tile))` with `--tile = (100dvh - chrome) / 2`, so two rows of five always fit the viewport. Home: `main` is a full-height flex column (navbar gap 26px, card centred, FAQ at the bottom); card is 16rem on phones, 24rem sm, 28rem lg, each capped by `100dvh - 440px`; smaller title/padding on phones.
Verified via Playwright (scripted, container Chromium) on `next build && next start`, throwaway Mongo, dev login as B: no vertical scroll on artists/tracks at 1440×900, 1366×657, 1280×720, 1024×640, 1920×1080; home no scroll at 1440×900, 390×844, 375×667; no horizontal overflow anywhere; `/dashboard` and `/on-repeat` land on `/on-repeat/artists`; PAST YEAR picked on artists stays selected after clicking TRACKS ON REPEAT; top 10 artists and tracks (LONG_TERM) match a direct DB query. Now playing checked with a mocked current track and a generated 8-colour cover (route interception), since nothing was playing and container Chromium can't load i.scdn.co.
Checks: typecheck clean, lint 1 pre-existing warning, build ok.
Not verified: a real playing track's colours; production after deploy. Home still scrolls ~40px at 1366×657.

## 2026-09-30 — On Repeat preloaded, skeleton instead of spinner, complete and verified
B saw a spinner on every visit and range switch. The fetch lived in the On Repeat layout, so it ran per range and again after any trip away from the page. Now `UserInsightsProvider` (`src/components/UserInsights.tsx`, mounted in `SessionLayout`) fetches all three ranges in parallel as soon as the page-load sync finishes, on any page. It lives in React memory only: it is reset when the signed-in user changes and refetched after every sync (rule 8; the old localStorage cache hid fresh syncs and could leak between users). While it loads, `TopArtists`/`TopTracks` render 10 "#n" cards with blurred, pulsing placeholder names in the same grid, so nothing jumps when the data lands; the flip/reveal animations are unchanged. `src/hooks/useUserInsights.ts` removed. B asked for `/dashboard` to be gone, so its redirect was dropped (now 404).
Verified via Playwright (scripted, container Chromium, 1440×900) on `next build && next start`, throwaway Mongo, dev login as B: a direct load of `/on-repeat/artists` goes from placeholders to names with no spinner at any sample (50ms); across artists/tracks × all 3 ranges plus a home round trip there were 0 new `/api/user-insights` requests and never a spinner or placeholder; all 6 lists match a direct DB query. With `lastTopItemsUpdate` aged 25h, a real sync took about 2.5s with placeholders showing, and the 3 insights requests fired only after the sync returned 200. `/dashboard` → 404.
Checks: typecheck clean, lint 1 pre-existing warning, build ok.
Not verified: production after deploy.
