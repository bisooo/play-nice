# Listening data model

What the DB keeps about B's listening, where each field comes from, and what to watch for when building stats on it. Schema: `prisma/schema.prisma`. Code: `src/lib/listeningHistory.mjs` (shared by the hourly collector and the import script).

## Three kinds of data

| What | Collections | Source | Covers |
|---|---|---|---|
| **Plays**: one document per listen | `Play` | Spotify's extended streaming history export (`EXPORT`) + recently played, hourly (`RECENTLY_PLAYED`) | 2015-10-16 → now, one timeline |
| **Catalog**: one document per track, artist, album | `Track`, `Artist`, `Album` | Spotify's batch lookups (`GET /tracks?ids=`, `/artists?ids=`) and recently played's track objects | every track that appears in a play |
| **Top lists**: Spotify's own rankings, daily | `TopArtistSnapshot`, `TopTrackSnapshot` (and the live `TopArtist`/`TopTrack`) | `GET /me/top/*` | from 2026-10-16 |

Top lists are Spotify's opinion (its own weighting, three fixed windows), not raw data, so they stay separate from plays. Stats over any period come from plays.

## Play

| Field | Meaning |
|---|---|
| `playedAt` | When the play **ended** (UTC). Export `ts` and API `played_at` are the same instant (checked to the second on 2026-10-16); the export has second precision, the API milliseconds. |
| `trackId` | Spotify track id → `Track._id`. |
| `msPlayed` | Time listened. **Exact for EXPORT.** For RECENTLY_PLAYED it's **estimated** (`msPlayedEstimated: true`): time since the previous play, capped at the track length. Overestimates when paused; agreed with the export on 35/36 plays checked. |
| `msPlayedEstimated` | `true` until an export covering that play replaces the estimate. |
| `contextType`, `contextUri` | Where it was played **from** (album, playlist, artist page). **RECENTLY_PLAYED only**; the export doesn't have it. |
| `country` | Country the play happened in (CZ, EG, GB, ...). **EXPORT only**; the API doesn't have it. The export's `ZZ` (unknown) is stored as null. |
| `source` | `EXPORT` or `RECENTLY_PLAYED`: which source first saved the play. |

**Each source has a field the other lacks: the export has `country`, recently played has "from" (`context*`).** A play both sources saw (the overlap when an export is imported after the collector already logged it) has both: it keeps its context and gets the export's country and exact `msPlayed`. So:

- Country stats work from 2015 up to the last export (2026-10-16), not for plays since.
- "From" stats (album vs playlist listening) only work from 2026-10-16.
- Skip/listened stats are exact up to the last export and estimated after it.

Unique on `(userId, playedAt, trackId)`: two sources' copies of the same listen are matched by same track within 1 second (`SAME_PLAY_MS`), and merged rather than duplicated.

### Rules for stats

- **Time zone:** `playedAt` is UTC. Group by day/month/hour in B's time zone explicitly (mostly `Europe/Prague`; plays in other countries are a known inaccuracy), e.g. `$dateToParts: { date: "$playedAt", timezone: "Europe/Prague" }`.
- **Time listened is `min(msPlayed, Track.durationMs)`, never raw `msPlayed`.** Each play is its own row (a replay or repeat is a new play), but the export sometimes logs one play far past the track's length (seeking back, a stalled or paused player): 5.3k plays, 65 of 3,772 hours, one A$AP Ferg "Shabba" at 976 minutes that made 2018-05-14 look like the biggest day ever. Raw `msPlayed` stays as Spotify reported it (history is append-only); stats cap it when they read. Counted/skip tests are unaffected.
- **A counted play is `msPlayed >= 30000`**, Spotify's own stream threshold. Shorter is a skip. Over the export: 65.4k of 80.8k music plays count.
- **Skips stay out of every stat unless the stat is about skips** (B, 2026-10-19): plays, hours, sessions, rankings all read `counted: true`; only the skip rates use all starts. The hub once showed 3,710 hours (skips included) against My Charts' 3,691.
- **Gaps:** the export has no plays 2015-10-29 → 2016-03-05, 2016-05-02 → 2017-10-18 and 2019-06-07 → 2020-09-17 (B wasn't listening on this account). Year-over-year stats should say so rather than show zeros as a trend.
- Recently played only returns the last 50 plays and seems to drop some very short ones (1 missed partial play of 38 on 2026-10-16), so post-export skip counts are slightly low.

## Catalog

| Collection | `_id` | Fields |
|---|---|---|
| `Track` | Spotify track id | `name`, `artistIds` (all artists, in order), `albumId`, `durationMs`, `enrichedAt`; `exportArtistName`, `exportAlbumName` as a fallback |
| `Artist` | Spotify artist id | `name`, `imageUrl`, `genres`, `enrichedAt` |
| `Album` | Spotify album id | `name`, `imageUrl`, `releaseDate` |

**Artist aliases:** Spotify sometimes has two ids for one artist (Ye's 2025 profile next to Kanye West). `ARTIST_ALIASES` in `src/lib/listeningHistory.mjs` maps the alias to the id stats use; tracks are stored with canonical ids only (on every catalog write, and `mergeArtistAliases` in the import script fixes tracks stored earlier), so stats need no special case. Add a line there when another one shows up.

Plays point at tracks by id; nothing about the track is copied onto the play, so a name or image is stored once. The export only has a track id plus the **album** artist's name, so imported tracks start as stubs and are filled in ("enriched") by `GET /tracks?ids=` (50 per call), which gives every artist, the album and the length; artists then get images and genres from `GET /artists?ids=`. The hourly collector enriches up to 50 new artists per run; tracks it sees in recently played come with full details. A track Spotify no longer returns keeps its export names and `artistIds: []`.

### Is this efficient on MongoDB?

Yes, if queries aggregate plays first and join after. Measured on a local copy with all 80.9k plays (2026-10-18):

- Top tracks all time, plays only (no join): ~0.1s.
- Top artists all time, joining every play to its track first: ~4.7s. **Don't do this.**
- Same, grouping plays by `trackId` first, then joining the ~13.5k distinct tracks: ~1.2s.
- Top artist per November across all years (time-zone grouping, group-then-join): ~0.5s.

So: `$group` by `trackId` (and the period) first, `$lookup` `Track` on the grouped rows, unwind `artistIds`, regroup, and `$lookup` names/images only for the final top N. If a stats page ever gets slow, copy `artistIds` onto each play (they never change for a track) before reaching for anything bigger. Atlas will be slower than local; measure there before optimizing.

## Prepared plays and stats

Stats never read `Play` directly. `PlayFact` (one row per play, same `_id`) has what they need already worked out: canonical `artistIds`, `albumId`/`releaseYear`, `listenedMs` (capped at the track's length), `counted` (30s+), `country`, and the Europe/Prague `date`/`year`/`month`/`day`/`hour`/`weekday`. It's derived: `refreshPlayFacts` (`src/lib/listeningHistory.mjs`) builds it inside Mongo with a `$merge`, and it can be dropped and rebuilt at any time. Plays and catalog stay the source of truth.

- **Hourly:** the collector adds rows for new plays only (`refreshRecentPlayFacts`, ~15ms). It does nothing until the first full rebuild.
- **Full rebuild** (~7–9s locally for 80.9k plays): `npm run history:rebuild` (also pushes the schema and recomputes the fixed stats), and the import script's last step. Run it after changing a rule (time zone, cap, aliases) or the PlayFact shape.
- **Fixed stats** (no visitor input) are computed by `computeHistoryStats` (`src/lib/historyStats.mjs`, ~3.5s locally, ~200 KB) and stored in `HistoryStats.stats`; the collector recomputes them when they're over 23h old. Served by `GET /api/history/stats`.
- **Interactive stats** run per request on PlayFact (10–230ms locally): `/api/history/top`, `/api/history/artist/[id]`, `/api/history/clock`, `/api/history/on-this-day`. They're CDN-cached for a day per data version: `HistoryStats.factsUpdatedAt` changes whenever rows are added or rebuilt, `/api/history/stats` returns it as `version`, and the routes require it as `?v=` (409 with the current version otherwise), so new plays mean new cache keys and made-up `v` values can't bypass the cache. Inputs are validated to fixed ranges.

Which stat comes from where: `docs/history-stats.md`.

## Importing an export

`npm run history:import -- <my_spotify_data.zip or folder>` (from the repo root, reads `.env.local`). It updates the schema, converts any plays stored in the pre-catalog shape, imports the music plays from `Streaming_History_Audio_*.json` (podcasts, audiobooks and video files are skipped), merges with collected plays, then enriches the catalog. Rerunning it, or importing a later export, only adds what's new. Cleaning: exact duplicate rows are dropped, and rows with the same second and track (the export repeats some with tiny `ms_played` differences) count once, keeping the longest.

Dropped from the export on purpose: IP address, device/platform, shuffle, skipped flag, start/end reasons, offline, incognito. Re-add only with a stats idea that needs them; the zip is the source.
