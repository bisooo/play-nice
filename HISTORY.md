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
