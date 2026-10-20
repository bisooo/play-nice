# PLAN.md

Lean status doc; full history is in HISTORY.md.

## Current status

- **Build:** `npm ci`, `tsc --noEmit`, `next build` pass on `74910ee` (2024-10-13); lint has 2 warnings.
- **Owner token:** `scripts/spotify-refresh-token.mjs` prints `SPOTIFY_REFRESH_TOKEN` (B's; set in Vercel and the cloud env 2026-09-30). Spotify did not rotate the refresh token on 3 refreshes. axios bumped to 1.20 (old one couldn't reach Spotify through the cloud proxy).
- **Stats hub (2026-10-19):** `/` is now the history stats hub (`src/components/StatsHub.tsx`): "Eleven years of my listening", four totals, then tiles in fours (My Charts, My Eras and Streaks as SOON teasers, Now playing). Nav unchanged; the logos link here.
- **My Charts (stat #1, 2026-10-19):** `/charts` (`src/components/MyCharts.tsx`). The headline sentence is the filter (year, month, time of day, place, combinable), state in the URL (`?kind&year&month&time&place`, each change is a history entry). `HistoryProvider` (`src/components/History.tsx`) loads `/api/history/stats` once per visit and caches each slice by query + version in memory; a 409 (new plays) reloads the version and drops cached slices.
- **My Eras (stat #2, 2026-10-19):** `/eras` (`src/components/MyEras.tsx`) from `stats.eras`. Years with 500+ plays; back-to-back years with the same No. 1 merge into a reign sized by its length (laptop: one horizontal strip; phone: rows, newest on top) with "2nd/3rd reign" badges. Tapping a reign shows each year: hours, plays, top 5, song of the year, a link to My Charts for it (laptop: panel under the strip, latest reign by default; phone: the row opens in place). Hub tile links here.
- **Deep Dive (stat #3, 2026-10-20):** `/deep-dive?artist=<id>` (`src/components/DeepDive.tsx`), default the all-time No. 1. Chips for my top 10 plus "+ Any artist" search over every artist with counted plays (`/api/history/artists`, filtered client-side as you type). Six facts as flip cards (how I found them, biggest year, peak month, longest streak, top song, when I play them), revealed per artist for the visit (not saved); plays per year and top 5 songs below. Replaced the Streaks tile on the hub (B: only built stats get tiles).
- **Now playing (moved to `/now-playing` 2026-10-19, was home):** public, B's live track. Layout (2026-09-30): exactly one screen tall, never scrolls (even with an FAQ answer open); the card is laid out for the space left with the FAQ closed and only scales down (transform, following the accordion) while an answer is open, so nothing reflows mid-animation, on phones a wide frosted card (336px max) around a 240px cover that shrinks only when height runs out; on larger screens the cover fills the card, never below 11rem; track/artist/album truncate to one line. Now playing polls every 5s while the tab is visible (none when hidden), checks again ~1s after the current track should end, honours Retry-After on 429, only re-renders when the track changes, preloads the cover and crossfades; the background lines fade to the new palette. Album colours checked only with mocked tracks and covers (nothing was playing).
- **Navbar (2026-09-30):** colored logo on both sides (both link home), links centred between them.
- **No login (2026-09-30):** Spotify dev mode caps an app at 5 allow-listed users, allowlist edits have no API, and extended quota needs a registered business with 250k+ monthly users, so B chose to drop login: the app shows B's listening to everyone. The server uses `SPOTIFY_REFRESH_TOKEN` (`src/lib/owner.ts`), keeps the access token on B's `User` row, and every route is public. NextAuth, `/profile`, the login UI and `/api/dev/login` are gone. Card reveals are per visitor (localStorage, key no longer has a user id, so B's old reveal progress reset).
- **Top-items sync:** verified 2026-09-30 with B's token (35–50 artists, 50 tracks per range stored).
- **On Repeat (was Dashboard):** renamed 2026-09-30, then split the same day into ARTISTS ON REPEAT (`/on-repeat/artists`) and TRACKS ON REPEAT (`/on-repeat/tracks`) nav tabs sharing a layout that keeps the time range and data; `/on-repeat` redirects to artists (temporary); `/dashboard` removed (404). All three time ranges are preloaded into memory right after the page-load sync, so switching tabs/ranges or coming back from home shows no loading; before that, blurred placeholder cards show instead of a spinner. On laptops (lg+) the 2×5 grid is capped by viewport height so neither page scrolls (checked 1024×640 to 1920×1080); phones scroll. Verified 2026-09-30 with B's data; top 10 per tab matches the DB. `popularity` is now always null. Top items sync automatically (2026-09-30): every page load asks the server to sync, which only runs if data is over 24h old (atomic claim on `lastTopItemsUpdate`, released on failure). The dashboard waits for that before reading, and reads straight from the DB (localStorage cache removed; since 2026-09-30 an in-memory preload refetched after each sync). Update Data button removed.
- **Card reveals (gamified 2026-09-30):** saved in localStorage per user, list and time range (`src/hooks/useReveals.ts`). A card is face-down until revealed (hover, click or tap) at its current rank; after a sync, new entries and rank changes go face-down again and show NEW / ↑n / ↓n once flipped. The first visit to a deck is the baseline (no badges). Reveals don't follow you across devices (DB storage is a future idea).
- **Sampler:** removed 2026-09-30 (page, API routes, components, nav link, home-page FAQ). Its Spotify endpoints are gone for dev-mode apps; re-confirmed with real calls that day.

- **Listening history (2026-10-16, live; reshaped 2026-10-18):** each top-items sync appends a dated snapshot of all six lists, and an hourly collector (GitHub Actions → `/api/internal/collect`) logs every play from recently played. Plays now point at a catalog (`Track`/`Artist`/`Album`) instead of copying track details, and B's extended streaming history export (2015-10-16 → 2026-10-16, 80.8k music plays) imports with `npm run history:import -- <zip>`; imported into production 2026-10-18 (B ran it: 80,830 export plays added, 50 merged, 63 earlier plays converted; 13,530 tracks, 4,292 artists). Data model and stats rules: `docs/data-model.md`. Stats data layer built 2026-10-18 (see History stats below); no stats UI yet.

## Data model

MongoDB via Prisma. `User` (spotifyId unique, email, name, accessToken, refreshToken, lastTopItemsUpdate) → `TopArtist` / `TopTrack` (spotifyId, name, imageUrl, popularity, genres/artistName/albumName, timeRange SHORT/MEDIUM/LONG, rank), unique on `(userId, spotifyId, timeRange)`. Sync replaces a user's items per time range in a transaction, and in the same transaction appends `TopArtistSnapshot` / `TopTrackSnapshot` (userId, timeRange, capturedAt, embedded items with rank; unique on userId+timeRange+capturedAt). `Play` (userId, playedAt, trackId, msPlayed (+ estimated flag), context or country, source RECENTLY_PLAYED/EXPORT), unique on (userId, playedAt, trackId) → catalog `Track` (artistIds, albumId, durationMs) / `Artist` (image, genres) / `Album`, keyed by Spotify id. Details: `docs/data-model.md`.

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

- [x] History collection live (2026-10-16): token re-minted with `user-read-recently-played`, `CRON_SECRET` set in Vercel + GitHub, prod indexes pushed. First manual "Collect listening" run green: 50 plays stored.
- [x] Export arrived and the import is built (2026-10-18): verified on a throwaway DB with the real export and B's token (80,842 plays added, 38 merged with collected ones, 13,530 tracks and 4,292 artists enriched, rerun adds nothing).
- [x] Production import done 2026-10-18 (B, locally): 80,893 plays (80,830 EXPORT, 63 RECENTLY_PLAYED), all tracks/artists enriched; hourly job green right after.
- [ ] Not verified: the hourly schedule firing on its own (manual runs verified 2026-10-16). GitHub pauses schedules after 60 days without repo activity on public repos; re-enable in the Actions tab if it stops.
- [x] Ideate history stats (2026-10-18): 17 stats ranked with real examples in `docs/history-stats.md`; B kept all of them. Fixed along the way: Ye merged into Kanye West (`ARTIST_ALIASES`), time listened capped at track length (CLAUDE.md rule 10).
- [ ] B: rerun `npm run history:import -- <zip>` locally once the alias commit is deployed, so production's existing Ye tracks get merged (step 5; everything else is a no-op).
- [x] History stats phase 1, data layer (2026-10-18): PlayFact + daily fixed stats + interactive routes, verified on a throwaway DB against raw plays.
- [x] Phase 1 live (2026-10-18): B ran `npm run history:rebuild` on production from their Mac: PlayFact 80,893 rows in 30.8s, fixed stats in 11.6s (65,500 counted plays, 3,710h, same as the throwaway DB). `/api/history/stats` serves them; `/api/history/top?month=11&v=…` returned Kendrick 325 / 070 Shake 277, CDN MISS 1.56s then HIT 0.19s; no `v` → 409.
- [ ] Watch: the collector recomputes the fixed stats daily inside its 60s limit (11.6s from B's Mac to Atlas, plus the top-items sync). If a collect run times out, move the stats to their own call.
- [ ] History stats phase 2: visuals one stat at a time (see below). #1 My Charts live and signed off by B 2026-10-19. #2 My Eras live. #3 Deep Dive built (Flip picked, search added); awaiting B's review. Next: #4.
- [x] Collect run failed 2026-10-19 19:18 (500, P2028): the top-tracks transaction passed Prisma's 5s default on a slow Atlas moment. Top-items transactions now get 20s; Prisma query logging (which wrote B's Spotify tokens to Vercel logs) is dev-only. Deployed; manual run green. Not verified: the 20s limit under a real slow moment.
- [ ] Watch: GitHub fires the hourly schedule only every 2–7h (runs on 2026-10-18/19). Spotify returns the last 50 plays, so a long gap on a heavy day loses plays. B chose to leave it (2026-10-19); the fix would be an external cron (e.g. cron-job.org) hitting the collector hourly.
- [x] Hub Now playing tile: B saw it reflect a live track (2026-10-19); it now polls every 5s while visible (checked with a mocked route: track change, stop, no polling when hidden).
- [x] Hours: B decided skips stay out of every stat unless it is about skips (2026-10-19). `computeHistoryStats` now counts time and sessions from counted plays only, so the hub matches My Charts (3,691) after the next daily recompute.

## History stats (B picked all 17, 2026-10-18)

Full list, how to show each and real examples: `docs/history-stats.md`. ⇄ = interactive.

1. Top of any slice ⇄ (year / month / every-November / time of day / country) · 2. Your eras (No. 1 artist per year) · 3. Artist deep dive ⇄ · 4. The Egyptian turn (genre mix over time) · 5. Comebacks · 6. Forgotten favourites ⇄ · 7. Discovery rate ⇄ · 8. Obsession days · 9. Listening clock ⇄ · 10. On this day ⇄ · 11. Seasonal artists ⇄ · 12. Travel soundtrack ⇄ (export only) · 13. Streaks ⇄ · 14. How old is your music ⇄ · 15. Ride or die · 16. Skip rate ⇄ · 17. Hours per year + longest session.

Phases (agreed 2026-10-18):
- **Phase 1, data layer (built 2026-10-18).** `PlayFact`: one prepared row per play (canonical artists, capped time, counted, Prague date parts), rebuilt from `Play` + catalog; the hourly collector adds new plays' rows, imports and `npm run history:rebuild` rebuild all. Fixed stats computed daily into `HistoryStats`; interactive stats (1, 3, 9, 10) are `/api/history/*` routes, CDN-cached per data version. Details: `docs/data-model.md`; which stat comes from where: `docs/history-stats.md`.
- **Phase 2, visuals, one stat at a time.** Mock each with real data on phone and laptop, B iterates on the look, then build. Data is ready, so rounds are about looks only.

Notes from B for phase 2 (2026-10-18):
- Results must feel instant: fixed stats are one stored doc and interactive ones are CDN-cached per data version (phase 1); the UI should also keep what it fetched in memory, like On Repeat does.
- When a stat changes, hide the change until B reveals it, like the On Repeat card flips, but chosen per stat rather than everywhere.
- (2026-10-19) Stats live at `/` as a hub of tiles (nav unchanged; the old home moves to `/now-playing`, a hub tile). Tiles come in fours (2×2 phone, 4 across laptop) and share one text rhythm: logo-font name, a hook, then what's inside, with fixed line counts so neighbours line up.
- Playful but tasteful: a hook says something the visual doesn't already show ("J. Cole leads all time, but my Octobers belong to Kanye West"); never narrate gaps the reader can see in the list ("beats X by 2 plays" is noise). Skip fine print that doesn't change what you see (e.g. the 30s play rule).
- Hub tile visuals show the stat itself: a sample query and its result (My Charts), the year winners (Eras), the streak on a calendar (Streaks), not generic photos. The hub's summary numbers come in fours too (plays, hours, artists, tracks).
- Motion: results ease in when they land (short stagger, bars grow, numbers count), lists fade back while loading; minimal and under a second, off with reduced motion (B, 2026-10-19).
- Use the logo font for big text (headlines, sentence filters, tile names, number labels) for contrast; numbers stay in Inter (heavy for big ones), since the logo font's stylised digits misread (65,500 looked like 655,5000).
- #1 look (2026-10-19): the headline is the filter, a sentence with tappable words ("My top artists every November are…") and "+ year / time of day / place" add-ons; ranked lists with a bar and "N plays"; artists and tracks side by side on laptop. No hiding for #1.
- #2 look (2026-10-19): Reigns, picked over a timeline and a yearbook as the most minimal; extra stats (hours, top 5, song of the year) appear on tap, not up front. No hiding.
- #3 look (2026-10-20): Flip, picked over a guess-first quiz and a chapter-by-chapter story: facts face down like On Repeat's cards. Hub tiles only for built stats (Streaks tile removed until #13). Reveal state is per visit.

## Future ideas

- (B, 2026-10-16) Others onboard themselves: an easy way to mint their own refresh token and request their Spotify extended history export, then an all-time stats dashboard once it arrives. Blocked by dev mode's 5-user cap (allow-list by email, no API); build it for B first.

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

Vercel project `play-nice` (team bisooos-projects), https://play-nice.vercel.app. Pushing `main` deploys to production (Git link repaired 2026-09-30; nothing had deployed since 2024-10-13). Git flow: B chose pushing straight to `main` (2026-09-29). Env vars needed there: the ones in `.env.example` (`CRON_SECRET` added 2026-10-16).

## Verification plan

Every round: `npx tsc --noEmit`, `npm run lint`, `npm run build`. UI: Playwright MCP against `next build && next start`, logged-out paths automated, signed-in paths with a real test account (manual) until a session stub exists. API routes: confirm 401 without a session.
