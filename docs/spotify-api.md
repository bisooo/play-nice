# Spotify Web API: what PLAY-NICE can use

The app runs in **Development Mode**. Extended quota (unlimited users) is out of reach: since 2025-05-15 it needs a registered business, a launched service with **at least 250k monthly active users**, commercial viability, and an application from a company email; review takes up to six weeks (https://developer.spotify.com/documentation/web-api/concepts/quota-modes, checked 2026-09-30). Last checked 2026-09-30 (recently played added 2026-10-16). Update this file whenever Spotify changes something or we start using a new endpoint.

## Dev-mode constraints

- App owner needs an active **Premium** subscription (since 2026-03-09).
- Max **5 users** per Client ID, each allow-listed in the Spotify dashboard (User Management, by the user's Spotify email). The dashboard refuses a 6th: "You have reached the maximum of 5 users in development mode."
- One Development Mode Client ID per developer (since 2026-02-11 for new apps, 2026-03-09 for existing), so a second app for more users isn't allowed (https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security).
- Redirect URIs: no `localhost`. Use `http://127.0.0.1:<port>/...` locally; HTTPS everywhere else.
- Token endpoint returns `expires_in` (seconds) and may return a new `refresh_token`; persist it.
- Refresh tokens expire **6 months after the user authorizes**; refreshing does not extend them (https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens, checked 2026-09-29). Users must sign in again after that.

## Rate limits

Counted per app over a rolling 30-second window; dev-mode apps get a lower, unpublished limit. A 429 carries `Retry-After` (seconds); wait that long. (https://developer.spotify.com/documentation/web-api/concepts/rate-limits, checked 2026-09-30.) Now playing is public and polled every 5s per visible tab, but the route is CDN-cached for 5s, so ~6 calls per 30s whatever the traffic.

## Endpoints we use

| Endpoint | Used by | Status |
|---|---|---|
| `GET /me` | owner's `spotifyId` on first token refresh (`src/lib/owner.ts`) | Works; **no `email`, `country`, `product`, `followers`** |
| `GET /me/player/currently-playing` | home card (polled every 5s by each visitor, CDN-cached 5s so Spotify sees ~1 call per 5s) | Works; 204 with no body when nothing is playing |
| `GET /me/top/artists`, `/me/top/tracks` (limit 50, 3 time ranges) | top-items sync | Works; **`popularity` removed** from artists/tracks, `followers` from artists |
| `GET /me/player/recently-played` (limit 50) | plays log, hourly via `/api/internal/collect` | Needs scope `user-read-recently-played` (added to the token script 2026-10-16; 403 without it). Only the **last 50 plays**, no older history; `played_at` is when the track finished |
| `GET /tracks?ids=`, `GET /artists?ids=` (50 ids) | catalog enrichment (`src/lib/listeningHistory.mjs`) | **Work again** (checked 2026-10-18: 200, 50/50 returned) though the Feb 2026 migration guide lists them as removed; artist `genres` and `images` still returned. Re-check if they start failing |
| `GET /search` | nothing (Record Analysis removed) | Works; max limit now 10 |
| `GET /recommendations` | nothing (Sampler removed 2026-09-30) | **Removed** for dev-mode apps (2024-11-27); 404 on 2026-09-30 |
| `GET /audio-features/{id}` | nothing (Sampler removed 2026-09-30) | **Removed** for dev-mode apps (2024-11-27); 403 on 2026-09-30 |
| `preview_url` on tracks | nothing (Sampler removed 2026-09-30) | **Always null** (2024-11-27; still null 2026-09-30) |

## Other removals to know about

- 2024-11-27: `/audio-analysis` (403 on 2026-09-30), `/artists/{id}/related-artists`, featured/category playlists.
- 2026-03-09: batch `GET /tracks|/albums|/artists|...` (but `/tracks?ids=` and `/artists?ids=` answered on 2026-10-18, see above), `/artists/{id}/top-tracks`, `/browse/new-releases`, `/browse/categories`, `/users/{id}`, `/users/{id}/playlists`, `/markets`; album `label`/`popularity`; `available_markets`.
- Renamed 2026: `/playlists/{id}/tracks` → `/playlists/{id}/items`; library writes consolidated into `PUT/DELETE /me/library`.

## Not available retroactively

Top items are only "as of now" (no past windows), and recently played only goes back 50 plays, so history exists only from when we start saving it. The one way to get older history is Spotify's own **Extended streaming history** download (Account → Privacy settings; arrives within ~30 days): every play since the account was made, with timestamps. B's arrived 2026-10-18 (2015-10-16 → 2026-10-16) and is imported with `npm run history:import`; see `docs/data-model.md`.

## Still available (candidate features)

`/me/tracks`, `/me/albums`, `/me/following`, `/me/playlists`, playlist create + `/playlists/{id}/items`, single `GET /tracks/{id}` / `/artists/{id}` / `/albums/{id}`. Artist `genres` still returned (2026-10-18; 2.5k of 4.3k of B's artists have some).

Sources: https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide and Spotify's 2024-11-27 developer blog post on Web API changes.
