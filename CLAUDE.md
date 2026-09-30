# PLAY-NICE

Personal Spotify stats app showing B's listening to anyone, no login: what's playing (album-art colored background), sync top artists/tracks into a DB, browse them per time range on the Artists/Tracks On Repeat pages (`/on-repeat/artists`, `/on-repeat/tracks`, formerly the dashboard). Scaffolded with v0 in 2024, revived 2026.

Status, roadmap and Open/Next live in `PLAN.md`. The session-by-session record lives in `HISTORY.md`; grep it, don't read it whole.

## Hard rules: do not violate these while moving fast

1. **Spotify tokens and the client secret never reach the browser.** All Spotify calls go through `SpotifyService` in server code (API routes / server actions), with the owner's token from `src/lib/owner.ts`. No route returns a token. Nothing secret in `NEXT_PUBLIC_*`.
2. **There is no login: every route is public and serves only the owner's data** (the account behind `SPOTIFY_REFRESH_TOKEN`, via `getOwner`/`getOwnerUser`). Never take a user id from the request. Anything a visitor can call repeatedly must be cheap or bounded (now playing is CDN-cached 5s; the sync runs at most once per 24h), since Spotify's rate limit is per app.
3. **Identity is `spotifyId`, never email.** Spotify stopped returning `email` to dev-mode apps in 2026; making it required once broke login entirely.
4. **Check every Spotify endpoint and field against `docs/spotify-api.md` before using it.** Spotify has removed endpoints and fields three times since 2024 (recommendations, audio features, previews, popularity, email). If it's not listed as available, verify against Spotify's current docs first and update the file.
5. **Token refresh uses `expires_in` (seconds) and persists a rotated `refresh_token`.** Reading a non-existent `expires_at` once made sessions die after an hour.
6. **Never touch production data.** Test with a disposable DB (local Mongo or a separate Atlas database), never the production `DATABASE_URL`.
7. **No production writes or deploys from a cloud/remote session without B's explicit OK in that session.**

8. **Anything that writes data a cache serves must invalidate that cache.** Update Data once synced fresh top items while the dashboard kept showing 24h-old localStorage data.

When a class of bug bites once and could come back, add a one-line rule here saying what it was and why.

## Commands

- `npm ci` — install (runs `prisma generate` via postinstall)
- `npm run dev` — dev server at **http://127.0.0.1:3000** (Spotify rejects `localhost` redirect URIs)
- `npm run build` / `npm start` — production build and serve
- `npx tsc --noEmit` — typecheck (run `next build` first on a fresh checkout if route types are missing)
- `npm run lint`
- `bash scripts/cloud-setup.sh` — cloud sessions, run first: starts the throwaway Mongo replica set, installs deps, pushes the schema (refuses a non-local DATABASE_URL)
- Real data: the app shows the account behind `SPOTIFY_REFRESH_TOKEN` (B's; set in Vercel and the cloud env). B refreshes it every 6 months with `node scripts/spotify-refresh-token.mjs` on their machine and updates both places.
- `npx prisma db push` — sync `prisma/schema.prisma` to MongoDB (Mongo has no Prisma migrations)

Every round: typecheck, lint, build (and tests once they exist). Report results.

## Env

Copy `.env.example` to `.env.local`: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, `DATABASE_URL`. Env files are gitignored; check `git status` before writing one, and flag immediately if a secret lands in a tracked file.

## Architecture

- Next.js 14 App Router, React 18, TypeScript, Tailwind 3, shadcn/ui (vendored in `src/components/ui`), framer-motion, recharts.
- No login (since 2026-09-30; Spotify dev mode caps an app at 5 users and extended quota needs 250k MAU). The app shows B's listening to everyone: `src/lib/owner.ts` refreshes the owner's access token from `SPOTIFY_REFRESH_TOKEN` (`src/lib/spotifyTokenManager.ts`) and keeps it on the owner's `User` row.
- Spotify: `src/lib/spotifyService.ts`, called from `src/app/api/spotify/*`. Errors mapped by `handleApiError` (`src/lib/apiUtils.ts`) so 401/429 surface correctly.
- DB: Prisma on MongoDB (`prisma/schema.prisma`): `User`, `TopArtist`, `TopTrack`. All access through `src/lib/userManager.ts`. Race safety comes from `@@unique` constraints, not app checks. Prisma transactions need a replica set (Atlas has one; local Mongo must run as a single-node replica set).
- Top-items sync: automatic. `TopItemsSyncProvider` (`src/components/TopItemsSync.tsx`) calls `POST /api/internal/updateUserTopItems` on each page load; the server syncs only if `lastTopItemsUpdate` is over 24h old → `src/services/userServices.ts`. `UserInsightsProvider` (`src/components/UserInsights.tsx`) waits for it, then preloads `GET /api/user-insights` for all three time ranges into memory (refetched after every sync, never localStorage); On Repeat (`src/components/OnRepeat.tsx`) reads from it and shows placeholder cards until it lands.

## How we work

- Plan before anything nontrivial and confirm the approach before coding. Bigger features get a proposal round: the real judgment calls as options, each with a recommendation. Build after B picks.
- Small, reviewable diffs: one feature, screen or function per change. Work in checkpoints: finish and verify one slice, take review feedback, then move on.
- Where an ask forks on an unspecified detail, pick the sensible default and say which. Ask only when it changes the outcome or can't be undone.
- No speculative abstractions and no quiet scope widening. New capability found along the way: ask. Worth doing later: log it in PLAN.md's future ideas.
- "Is X done?" means search the code and docs to confirm, not assume.
- Delegate open-ended research to a subagent to keep the main context clean.
- Decisions made in chat end up in a doc (PLAN.md, or here if it's a rule).

## End of every session

Update `PLAN.md` (status, Open/Next, anything stale), append a `HISTORY.md` entry (template at the top of that file), commit both. Every so often, audit the docs against reality (`git log`, the code) for stale claims and dangling references.

## Verification: "done" means verified

- Never report done without verifying end to end, and say how (tool, what was checked, what the DB looked like after).
- UI changes: drive the real flow with Playwright MCP (`.mcp.json`), confirm via the DOM/computed styles/accessibility tree and the DB, not screenshots alone. Check a narrow viewport. Final and perf checks on `next build && next start`, not `next dev`.
- Cloud sessions see B's real Spotify data through `SPOTIFY_REFRESH_TOKEN`; with a throwaway DB that's safe. List what wasn't verified.
- Cross-check numbers the UI shows (ranks, counts) against a direct DB query.
- State explicitly what wasn't verified and why, and list it in PLAN.md Open/Next.
- Measure before optimizing; revert temporary instrumentation and confirm with `git diff`.

## Debugging

- Reproduce to find the root cause; say how it was confirmed. Look for one cause behind several symptoms. Read the logs (server, Spotify error bodies) before theorizing.
- "Flake" isn't a root cause: retry once, then say so. Keep pre-existing failures separate from new ones (`git log` on the file).
- When a fix regresses, check whether a later change undid it; fix the root cause.

## Framework and library notes

- Libraries move faster than training data. Check the **installed** version's docs (and Spotify's current Web API docs) before using an API; heed deprecations. If the current docs change a tradeoff, explain it and let B decide.
- Next 14 here, not 15/16: `params` are sync, `middleware.ts` (not `proxy.ts`), no `"use cache"`. Re-read these notes after any upgrade.
- GET route handlers without dynamic functions are static at build time in Next 14: public routes need `export const dynamic = 'force-dynamic'`. Cache at the data or CDN level only once measured. No in-memory server caches: each serverless instance keeps its own copy and nothing can invalidate them all (one kept the dashboard stale after a sync).
- Keep global resets inside `@layer base`; an unlayered rule silently beats Tailwind utilities.
- shadcn/ui for buttons and form controls, restyled to the app's look. Run `git diff` after any shadcn CLI scaffolding (it can rewrite `layout.tsx`).
- No `window.confirm`/`alert`; use in-app components. Text meets WCAG AA contrast (album-color backgrounds make this easy to break).
- Guard async fetches with a request-id ref so a stale response can't overwrite a newer one; wrap fetches in try/catch so network errors reach the error UI.
- Dates: never slice UTC ISO strings or rely on the machine time zone; use the user's time zone explicitly (matters for "listening clock" stats).
- axios must stay >= 1.16.1: older versions send plain HTTP to the cloud egress proxy (405), so every Spotify call failed in cloud sessions.
- Install libraries only when the work needs them. Approved beyond current deps: none yet; propose additions.

## Git

- Commit messages: one line, imperative, under ~60 chars. No body unless genuinely needed.
- No `Co-Authored-By` or "Generated with Claude Code" trailers.
- Commits are authored as B (`Basel`, same email as the existing history), unsigned. Cloud containers default to Claude's name, email and SSH signing key, which once left Claude listed as a contributor; `.claude/settings.json` runs `scripts/git-identity.sh` at session start to fix that and enable `.githooks/commit-msg`, which strips AI trailers. Run it yourself if `git config user.name` isn't Basel.
- Push small progressive commits to `main`, rebased on the latest `origin/main`. If pushing `main` deploys (assumed Vercel git integration; confirm in PLAN.md Deployment), don't push until B confirms unless the task brief says to.
- Parallel sessions use separate worktrees: `npm ci`, copy `.env.local` from the main checkout, use a non-default port.

## Communication

Short and plain, answer first. Back claims with what was checked (file:line, output, query) or say it's inferred. Surface tradeoffs as a decision with a recommendation and a small set of options.
