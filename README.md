# PLAY-NICE

A late-night idea about finding interesting music listening metrics and having them readily available. Log in with Spotify to see what's playing, sync your top artists and tracks, and browse them across three time ranges.

## Setup

1. Create an app at the [Spotify developer dashboard](https://developer.spotify.com/dashboard).
   - The app owner needs **Spotify Premium** (Development Mode requirement since March 2026).
   - Add the redirect URI `http://127.0.0.1:3000/api/auth/callback/spotify` (Spotify rejects `localhost`).
   - Add each user's Spotify account under User Management (max 5 in Development Mode).
2. Get a MongoDB connection string (e.g. MongoDB Atlas).
3. `cp .env.example .env.local` and fill it in.
4. `npm ci`, then `npx prisma db push` to create the indexes.
5. `npm run dev` and open http://127.0.0.1:3000.

## Docs

- `CLAUDE.md` — rules and conventions for working on the repo
- `PLAN.md` — current status, roadmap, open items
- `HISTORY.md` — session-by-session log
- `docs/spotify-api.md` — which Spotify endpoints still work in Development Mode
