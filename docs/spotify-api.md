# Spotify Web API: what PLAY-NICE can use

The app runs in **Development Mode**. Extended quota (unlimited users) is out of reach: since 2025-05-15 it needs a registered business, a launched service with **at least 250k monthly active users**, commercial viability, and an application from a company email; review takes up to six weeks (https://developer.spotify.com/documentation/web-api/concepts/quota-modes, checked 2026-09-30). Last checked 2026-09-30. Update this file whenever Spotify changes something or we start using a new endpoint.

## Dev-mode constraints

- App owner needs an active **Premium** subscription (since 2026-03-09).
- Max **5 users** per Client ID, each allow-listed in the Spotify dashboard (User Management, by the user's Spotify email). The dashboard refuses a 6th: "You have reached the maximum of 5 users in development mode."
- One Development Mode Client ID per developer (since 2026-02-11 for new apps, 2026-03-09 for existing), so a second app for more users isn't allowed (https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security).
- Redirect URIs: no `localhost`. Use `http://127.0.0.1:<port>/...` locally; HTTPS everywhere else.
- Token endpoint returns `expires_in` (seconds) and may return a new `refresh_token`; persist it.
- Refresh tokens expire **6 months after the user authorizes**; refreshing does not extend them (https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens, checked 2026-09-29). Users must sign in again after that.

## Rate limits

Counted per app over a rolling 30-second window; dev-mode apps get a lower, unpublished limit. A 429 carries `Retry-After` (seconds); wait that long. (https://developer.spotify.com/documentation/web-api/concepts/rate-limits, checked 2026-09-30.) Now playing polls once per 5s per visible tab, so at most ~6 calls per 30s per user (5 users max).

## Endpoints we use

| Endpoint | Used by | Status |
|---|---|---|
| `GET /me` (via NextAuth profile) | login | Works; **no `email`, `country`, `product`, `followers`** |
| `GET /me/player/currently-playing` | home card (polled every 5s, trimmed server-side) | Works; 204 with no body when nothing is playing |
| `GET /me/top/artists`, `/me/top/tracks` (limit 50, 3 time ranges) | top-items sync | Works; **`popularity` removed** from artists/tracks, `followers` from artists |
| `GET /search` | nothing (Record Analysis removed) | Works; max limit now 10 |
| `GET /recommendations` | nothing (Sampler removed 2026-09-30) | **Removed** for dev-mode apps (2024-11-27); 404 on 2026-09-30 |
| `GET /audio-features/{id}` | nothing (Sampler removed 2026-09-30) | **Removed** for dev-mode apps (2024-11-27); 403 on 2026-09-30 |
| `preview_url` on tracks | nothing (Sampler removed 2026-09-30) | **Always null** (2024-11-27; still null 2026-09-30) |

## Other removals to know about

- 2024-11-27: `/audio-analysis` (403 on 2026-09-30), `/artists/{id}/related-artists`, featured/category playlists.
- 2026-03-09: batch `GET /tracks|/albums|/artists|...`, `/artists/{id}/top-tracks`, `/browse/new-releases`, `/browse/categories`, `/users/{id}`, `/users/{id}/playlists`, `/markets`; album `label`/`popularity`; `available_markets`.
- Renamed 2026: `/playlists/{id}/tracks` → `/playlists/{id}/items`; library writes consolidated into `PUT/DELETE /me/library`.

## Still available (candidate features)

`/me/player/recently-played` (last 50), `/me/tracks`, `/me/albums`, `/me/following`, `/me/playlists`, playlist create + `/playlists/{id}/items`, single `GET /tracks/{id}` / `/artists/{id}` / `/albums/{id}`. Artist `genres` is not listed as removed; verify before relying on it.

Sources: https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide and Spotify's 2024-11-27 developer blog post on Web API changes.
