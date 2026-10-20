# Listening history stats

B picked all 17 (2026-10-18); build plan in PLAN.md.

Ranked by how interesting they are with B's actual data. Every example below is a real result from the full history (80,893 plays, 2015-10-16 → 2026-10-18: the export plus the latest recently played) loaded into a throwaway local DB on 2026-10-18. Counted play = 30s or more; dates in Europe/Prague; a track's plays count for every artist on it.

⇄ = interactive (change the input, the result updates).

| # | Stat | ⇄ | How to show it | Real example |
|---|---|---|---|---|
| 1 | **Top of any slice**: top artists and tracks for a year, a month, "every November", a time of day, a country | ⇄ year / month / all-years-of-a-month / hour range / country | Picker row over a ranked list with artist images (reuse the On Repeat cards) | Every November: Kendrick Lamar 325, 070 Shake 277, Blood Orange 230. Nov 2021 alone: Blood Orange 161, Dave 121. Nights (0–5h): Anderson .Paak 336, J. Cole 243, SZA 222 |
| 2 | **Your eras**: number-one artist of each year | | Horizontal timeline, one artist photo per year, tap to open that year in #1 | 2018 J. Cole · 2019 Anderson .Paak · 2020 J. Cole · 2021 Kanye West (1,020) · 2022 Kendrick Lamar (1,062) · 2023 Kendrick · 2024 Tems · 2025 Marwan Moussa · 2026 J. Cole (600) |
| 3 | **Artist deep dive**: how you found them, plays per year, peak month, top tracks, longest streak | ⇄ artist search | Artist page: first-play card ("found via ..."), small bar chart by year, top 5 tracks | Kendrick: first play 2016-03-05 (untitled 01); peaked May 2022 with 305 plays (Mr. Morale month); 18 days in a row ending 2020-10-08. Anderson .Paak found 2018-01-08 via NxWorries "Suede"; 070 Shake via Nas "Not For Radio"; Tems via Drake "Fountains" |
| 4 | **The Egyptian turn**: genre mix over the years | ⇄ tap a genre to see its artists that year | Stacked area chart by year (genres from Spotify artist data) | Arabic/Egyptian artists went 0% (2020) → 3% (2022) → 9% (2024) → 16% (2025) → 24% (2026). 2026's top genres: egyptian pop 24%, arabic hip hop 20% |
| 5 | **Comebacks**: artists you came back to after years away | | List with "gap" bars: last play before, first play after | Akon: 2,622 days (2019-05-30 → 2026-08-03). Stormzy 5 years, Wretch 32 4.5 years (2020 → 2025) |
| 6 | **Forgotten favourites**: tracks you played a lot and then dropped | ⇄ "not played in" 1 / 2 / 3 years | Track list with play count and last-played date, Spotify link to replay | Saba "Photosynthesis": 109 plays, last 2024-01-15. Marwan Pablo "Ghaba" 80, last 2023-09. Tyler "Potato Salad" 74 |
| 7 | **Discovery rate**: new artists found per year, and the biggest find of each year | ⇄ year | Bar chart, biggest find's photo on each bar | 2020: 137 new artists (biggest: Baby Keem, Dave, The Alchemist). 2018: 111 (.Paak, Isaiah Rashad, 070 Shake). 2024: 9 (TUL8TE). 2025: 4. Discovery has nearly stopped |
| 8 | **Obsession days**: the most plays of one track in a single day | | List of "days on repeat" with track art | Erykah Badu "Didn't Cha Know" 11 times on 2020-11-23. ROSALÍA "COMO UN G" 9 times on 2022-03-23. 070 Shake "Skin and Bones" 9 times on 2022-06-03 |
| 9 | **Listening clock**: when in the day you listen, overall or for one artist | ⇄ artist / year | 24-hour radial chart | Peak at 18:00 (6,032 plays), quietest 6:00 (441). Monday is the biggest day of the week, Saturday the smallest |
| 10 | **On this day**: what you played on today's date in past years | ⇄ date (defaults to today) | Cards per year, most-played track of that day | 18 Oct 2020: 134 plays, most Childish Gambino "I. The Worst Guys". 18 Oct 2025: Marwan Moussa "SAM3AAK" 5 times |
| 11 | **Seasonal artists**: artists you mostly play in one season | ⇄ season | Four columns (winter/spring/summer/autumn) | Alicia Keys 88% in winter. Snoh Aalegra 66% summer, Clipse 68% summer, ROSALÍA 65% spring, El Michels Affair 62% autumn |
| 12 | **Travel soundtrack**: what you played in each country | ⇄ country | Map or country list, top artists per country | Egypt: Kendrick, J. Cole, Kid Cudi. UK: Nas first. Turkey: 070 Shake. Spain: Snoh Aalegra. (Export only: no country for plays after 2026-10-16) |
| 13 | **Streaks**: longest run of days listening, overall and per artist | ⇄ artist | Big number + calendar heatmap with the streak highlighted | 93 days in a row ending 2022-09-26. Per artist: Kendrick 18 days, Kid Cudi 17, Vince Staples 14 |
| 14 | **How old is your music**: release age of what you play, per year | ⇄ year | Histogram of release years | Median age 2–4 years every year; 10+ years old rose from 7% (2018) to 24% (2025). Most-played oldies: Hamid Al Shaeri "Ouda" (1987) 46 plays, Zaki Nassif (1984) 42 |
| 15 | **Ride or die**: artists in every year of your history | | Ranked list with a dot per year | J. Cole in all 12 years (2015–2026, 3,040 plays). Kendrick, A$AP Rocky, Drake, Ty Dolla $ign 11 |
| 16 | **Skip rate**: artists you skip most and never skip | ⇄ min plays | Two short lists | Most skipped: Ari Lennox 36%, Drake 35%, 2Pac 33%. Least: Alicia Keys 6%, Snoh Aalegra 7%, Apollo Brown 8% |
| 17 | **Hours per year** and longest session | | Bar chart with the account gaps marked, not shown as zeros | 2022 peak: 936h. 2021 762h, 2024 368h, 2026 247h so far. Longest session: 9h, 125 plays, starting 2020-11-19 03:43 |

## Where each stat's data comes from (phase 1, built 2026-10-18)

Fixed = `GET /api/history/stats` → `stats.<key>` (recomputed daily). Interactive = its own route, `?v=<version>` required. See `docs/data-model.md`, "Prepared plays and stats".

| # | Stat | Source |
|---|---|---|
| 1 | Top of any slice (built as My Charts, `/charts`) | `/api/history/top?year&month&from&to&country` |
| 2, 17 | Eras (#2 built as My Eras, `/eras`), hours per year | `eras` (per year: plays, hours, skip rate, top 5 artists, top track) |
| 3 | Artist deep dive (built as Deep Dive, `/deep-dive`) | `/api/history/artist/[id]` (first play + via, per year, peak month, top tracks, streak, by hour); search: `/api/history/artists` (every artist with counted plays as `[id, name, plays]`, ~100 KB gzipped, fetched when search opens) |
| 4 | Genre mix | `genres` (per year: top 10 genres with share and top 3 artists) |
| 5 | Comebacks | `comebacks` |
| 6 | Forgotten favourites | `forgotten` (not played for 1y+, 30+ plays; page filters 2y/3y by `lastPlayed`) |
| 7 | Discovery rate | `discovery` (per year: count, biggest 5 finds with the track that introduced them) |
| 8 | Obsession days | `obsessions` |
| 9 | Listening clock | `clock` (all time); `/api/history/clock?artist&year` |
| 10 | On this day | `/api/history/on-this-day?month&day` |
| 11 | Seasonal artists | `seasonal.{winter,spring,summer,autumn}` |
| 12 | Travel soundtrack | `travel` |
| 13 | Streaks | `streaks` (overall + top 10 artists), `daily` (plays per date, for a calendar); per artist via #3 |
| 14 | How old is your music | `age` (per year: median age, same-year and 10y+ shares, plays per release year) |
| 15 | Ride or die | `rideOrDie` |
| 16 | Skip rate | `skipRate` (artists with 100+ starts; page filters by plays) |
| 17 | Longest session | `sessions.longest` |

Also: `totals` (plays, hours, artists, tracks, first/last play, `accountGaps` for marking gaps on year charts).

## Data issues found while querying (fixed 2026-10-18)

- Kanye West and Ye were two Spotify artist ids, splitting his counts (Ye showed up as a "2025 discovery"). Now merged in the catalog: `ARTIST_ALIASES`, see `docs/data-model.md`.
- 5.3k plays run past the track's length (65 of 3,772 hours), one A$AP Ferg "Shabba" at 976 minutes, which made 2018-05-14 the fake "biggest day ever" in #17. Stats cap each play at the track's length (CLAUDE.md rule 10).
- Account gaps (2015-10 → 2016-03, 2016-05 → 2017-10, 2019-06 → 2020-09) make 2016–2017 nearly empty; year charts should mark them.
- Credit choice: plays count for every artist on a track (so Baby Keem's "family ties" counts for Kendrick). Primary-artist-only is the alternative.

## Speed

All of the above ran in seconds on a local copy, mostly helped by a scratch collection with each play's artist ids and local date parts pre-joined. That matches the doc's advice: if a stats page is slow on Atlas, copy `artistIds` (and maybe local year/month/hour) onto each play.
