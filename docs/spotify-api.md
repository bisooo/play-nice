# Spotify Web API: what PLAY-NICE can use

The app runs in **Development Mode** (extended quota is only for organizations). Last checked 2026-09-29. Update this file whenever Spotify changes something or we start using a new endpoint.

## Dev-mode constraints

- App owner needs an active **Premium** subscription (since 2026-03-09).
- Max **5 users**, each allow-listed in the Spotify dashboard.
- Redirect URIs: no `localhost`. Use `http://127.0.0.1:<port>/...` locally; HTTPS everywhere else.
- Token endpoint returns `expires_in` (seconds) and may return a new `refresh_token`; persist it.
- Refresh tokens expire **6 months after the user authorizes**; refreshing does not extend them (https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens, checked 2026-09-29). Users must sign in again after that.

## Endpoints we use

| Endpoint | Used by | Status |
|---|---|---|
| `GET /me` (via NextAuth profile) | login | Works; **no `email`, `country`, `product`, `followers`** |
| `GET /me/player/currently-playing` | home card | Works |
| `GET /me/top/artists`, `/me/top/tracks` (limit 50, 3 time ranges) | top-items sync | Works; **`popularity` removed** from artists/tracks, `followers` from artists |
| `GET /search` (limit 1) | Record Analysis | Works; max limit now 10 |
| `GET /recommendations` | Record Digger | **Removed** for dev-mode apps (2024-11-27) |
| `GET /audio-features/{id}` | Record Analysis | **Removed** for dev-mode apps (2024-11-27) |
| `preview_url` on tracks | play buttons | **Always null** (2024-11-27) |

## Other removals to know about

- 2024-11-27: `/audio-analysis`, `/artists/{id}/related-artists`, featured/category playlists.
- 2026-03-09: batch `GET /tracks|/albums|/artists|...`, `/artists/{id}/top-tracks`, `/browse/new-releases`, `/browse/categories`, `/users/{id}`, `/users/{id}/playlists`, `/markets`; album `label`/`popularity`; `available_markets`.
- Renamed 2026: `/playlists/{id}/tracks` → `/playlists/{id}/items`; library writes consolidated into `PUT/DELETE /me/library`.

## Still available (candidate features)

`/me/player/recently-played` (last 50), `/me/tracks`, `/me/albums`, `/me/following`, `/me/playlists`, playlist create + `/playlists/{id}/items`, single `GET /tracks/{id}` / `/artists/{id}` / `/albums/{id}`. Artist `genres` is not listed as removed; verify before relying on it.

Sources: https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide and Spotify's 2024-11-27 developer blog post on Web API changes.
