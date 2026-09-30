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
Not verified: production sign-in after the resume (B to retry); `prisma db push` against Atlas; Vercel runtime logs (connector 403 on the team scope).
