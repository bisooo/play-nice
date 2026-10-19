// Listening history stats, computed from PlayFact (docs/data-model.md, "Prepared plays"). The
// stat list and how each is shown: docs/history-stats.md. Plain JS so scripts can run it too.
//
// Fixed stats (no visitor input) are computed once a day by computeHistoryStats and stored in
// HistoryStats.stats. Interactive stats (topOfSlice, artistDeepDive, listeningClock, onThisDay)
// run per request on PlayFact. Counted play = 30s or more; plays count for every artist on a
// track; dates are Europe/Prague.

const DAY_MS = 24 * 60 * 60 * 1000;
const DISCOVERY_MIN_PLAYS = 20; // an artist counts as "found" once they reach this many plays
const COMEBACK_MIN_PLAYS = 50;
const FORGOTTEN_MIN_PLAYS = 30;
const SEASONAL_MIN_PLAYS = 150;
const SKIP_MIN_STARTS = 100;
const ACCOUNT_GAP_DAYS = 60; // no plays this long = a gap in the account, not a trend
const SESSION_BREAK_MS = 30 * 60 * 1000;
const SEASONS = { 12: 'winter', 1: 'winter', 2: 'winter', 3: 'spring', 4: 'spring', 5: 'spring', 6: 'summer', 7: 'summer', 8: 'summer', 9: 'autumn', 10: 'autumn', 11: 'autumn' };

async function aggregate(prisma, userId, pipeline) {
  return prisma.playFact.aggregateRaw({
    pipeline: [{ $match: { userId: { $oid: userId } } }, ...pipeline],
    options: { allowDiskUse: true },
  });
}

const dayDiff = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / DAY_MS); // YYYY-MM-DD strings
const top = (rows, n, key = 'plays') => [...rows].sort((a, b) => b[key] - a[key]).slice(0, n);
const hours = ms => Math.round(ms / 36e5);

// Longest run of consecutive dates in a sorted list
function longestStreak(dates) {
  let best = { days: 0 }, start = 0;
  for (let i = 0; i < dates.length; i++) {
    if (i > 0 && dayDiff(dates[i - 1], dates[i]) !== 1) start = i;
    if (i - start + 1 > best.days) best = { days: i - start + 1, from: dates[start], to: dates[i] };
  }
  return best;
}

// Names and images for the ids a result mentions, looked up once at the end
async function labels(prisma, { artistIds = [], trackIds = [] }) {
  const [artists, tracks] = await Promise.all([
    prisma.artist.findMany({ where: { id: { in: [...new Set(artistIds)] } }, select: { id: true, name: true, imageUrl: true } }),
    prisma.track.findMany({ where: { id: { in: [...new Set(trackIds)] } }, select: { id: true, name: true, artistIds: true, albumId: true, exportArtistName: true } }),
  ]);
  const albums = await prisma.album.findMany({ where: { id: { in: tracks.map(t => t.albumId).filter(Boolean) } }, select: { id: true, imageUrl: true } });
  const mainArtists = await prisma.artist.findMany({ where: { id: { in: tracks.map(t => t.artistIds[0]).filter(Boolean) } }, select: { id: true, name: true } });
  const artistById = new Map(artists.map(a => [a.id, a]));
  const albumById = new Map(albums.map(a => [a.id, a]));
  const mainById = new Map(mainArtists.map(a => [a.id, a]));
  return {
    artist: id => ({ id, name: artistById.get(id)?.name ?? null, imageUrl: artistById.get(id)?.imageUrl ?? null }),
    track: id => {
      const t = tracks.find(x => x.id === id);
      return {
        id,
        name: t?.name ?? null,
        artist: mainById.get(t?.artistIds[0])?.name ?? t?.exportArtistName ?? null,
        imageUrl: albumById.get(t?.albumId)?.imageUrl ?? null,
      };
    },
  };
}

// --- Fixed stats -----------------------------------------------------------------------------

export async function computeHistoryStats(prisma, userId, now = new Date()) {
  const counted = { $match: { counted: true } };
  const [artistDays, artistFirst, trackDays, years, artistStarts, primaryYears, ages, countries, countryArtists, yearArtists, yearTracks, clock, plays] = await Promise.all([
    aggregate(prisma, userId, [counted, { $unwind: '$artistIds' }, { $group: { _id: { a: '$artistIds', d: '$date' }, plays: { $sum: 1 } } }]),
    aggregate(prisma, userId, [counted, { $sort: { playedAt: 1 } }, { $unwind: '$artistIds' }, { $group: { _id: '$artistIds', date: { $first: '$date' }, trackId: { $first: '$trackId' } } }]),
    aggregate(prisma, userId, [counted, { $group: { _id: { t: '$trackId', d: '$date' }, plays: { $sum: 1 } } }]),
    // Time listened counts counted plays only: skips stay out of every stat but the skip rate
    aggregate(prisma, userId, [{ $group: { _id: '$year', starts: { $sum: 1 }, plays: { $sum: { $cond: ['$counted', 1, 0] } }, ms: { $sum: { $cond: ['$counted', '$listenedMs', 0] } } } }]),
    aggregate(prisma, userId, [{ $unwind: '$artistIds' }, { $group: { _id: '$artistIds', starts: { $sum: 1 }, plays: { $sum: { $cond: ['$counted', 1, 0] } } } }, { $match: { starts: { $gte: SKIP_MIN_STARTS } } }]),
    aggregate(prisma, userId, [counted, { $group: { _id: { a: { $first: '$artistIds' }, y: '$year' }, plays: { $sum: 1 } } }]),
    aggregate(prisma, userId, [counted, { $match: { releaseYear: { $ne: null } } }, { $group: { _id: { y: '$year', r: '$releaseYear' }, plays: { $sum: 1 } } }]),
    aggregate(prisma, userId, [counted, { $match: { country: { $ne: null } } }, { $group: { _id: '$country', plays: { $sum: 1 }, years: { $addToSet: '$year' } } }]),
    aggregate(prisma, userId, [counted, { $match: { country: { $ne: null } } }, { $unwind: '$artistIds' }, { $group: { _id: { c: '$country', a: '$artistIds' }, plays: { $sum: 1 } } }]),
    aggregate(prisma, userId, [counted, { $unwind: '$artistIds' }, { $group: { _id: { y: '$year', a: '$artistIds' }, plays: { $sum: 1 } } }]),
    aggregate(prisma, userId, [counted, { $group: { _id: { y: '$year', t: '$trackId' }, plays: { $sum: 1 } } }]),
    aggregate(prisma, userId, [counted, { $group: { _id: { h: '$hour', w: '$weekday' }, plays: { $sum: 1 } } }]),
    prisma.playFact.findMany({ where: { userId }, orderBy: { playedAt: 'asc' }, select: { playedAt: true, listenedMs: true, date: true, counted: true } }),
  ]);

  // Per artist: dates played (sorted), total plays, plays per season
  const artists = new Map();
  for (const { _id, plays: n } of artistDays) {
    if (!artists.has(_id.a)) artists.set(_id.a, { id: _id.a, dates: [], plays: 0, seasons: {} });
    const a = artists.get(_id.a);
    a.dates.push(_id.d);
    a.plays += n;
    const season = SEASONS[Number(_id.d.slice(5, 7))];
    a.seasons[season] = (a.seasons[season] ?? 0) + n;
  }
  for (const a of artists.values()) a.dates.sort();
  const first = new Map(artistFirst.map(f => [f._id, f]));

  // Per track: total plays, last date, best single day
  const tracks = new Map();
  for (const { _id, plays: n } of trackDays) {
    if (!tracks.has(_id.t)) tracks.set(_id.t, { id: _id.t, plays: 0, last: _id.d, bestDay: { date: _id.d, plays: 0 } });
    const t = tracks.get(_id.t);
    t.plays += n;
    if (_id.d > t.last) t.last = _id.d;
    if (n > t.bestDay.plays) t.bestDay = { date: _id.d, plays: n };
  }

  // Days with plays, and the account's gaps
  const daily = {};
  for (const p of plays) if (p.counted) daily[p.date] = (daily[p.date] ?? 0) + 1;
  const activeDates = Object.keys(daily).sort();
  const gaps = [];
  for (let i = 1; i < activeDates.length; i++) {
    if (dayDiff(activeDates[i - 1], activeDates[i]) > ACCOUNT_GAP_DAYS) gaps.push({ from: activeDates[i - 1], to: activeDates[i] });
  }

  // Sessions: counted plays less than 30 min apart (start of a play = end minus time listened)
  const sessions = [];
  let session = null;
  for (const p of plays) {
    if (!p.counted) continue;
    const end = p.playedAt.getTime();
    const start = end - p.listenedMs;
    if (!session || start - session.end > SESSION_BREAK_MS) {
      session = { start, end, plays: 0 };
      sessions.push(session);
    }
    session.end = Math.max(session.end, end);
    session.plays++;
  }

  // #2 eras + #17 hours per year
  const yearRows = [...years].sort((a, b) => a._id - b._id);
  const eras = yearRows.map(y => ({
    year: y._id,
    plays: y.plays,
    hours: hours(y.ms),
    skipRate: y.starts ? 1 - y.plays / y.starts : 0,
    topArtists: top(yearArtists.filter(r => r._id.y === y._id).map(r => ({ id: r._id.a, plays: r.plays })), 5),
    topTrack: top(yearTracks.filter(r => r._id.y === y._id).map(r => ({ id: r._id.t, plays: r.plays })), 1)[0] ?? null,
  }));

  // #4 genre mix per year, from each play's main artist (2026: Spotify still returns genres)
  const genreArtists = await prisma.artist.findMany({ where: { id: { in: [...new Set(primaryYears.map(r => r._id.a))] } }, select: { id: true, genres: true } });
  const genresOf = new Map(genreArtists.map(a => [a.id, a.genres]));
  const genres = yearRows.map(({ _id: year }) => {
    const rows = primaryYears.filter(r => r._id.y === year);
    const total = rows.reduce((sum, r) => sum + r.plays, 0);
    const byGenre = new Map();
    for (const r of rows) {
      for (const g of genresOf.get(r._id.a) ?? []) {
        if (!byGenre.has(g)) byGenre.set(g, { genre: g, plays: 0, artists: [] });
        const entry = byGenre.get(g);
        entry.plays += r.plays;
        entry.artists.push({ id: r._id.a, plays: r.plays });
      }
    }
    return {
      year,
      plays: total,
      genres: top([...byGenre.values()], 10).map(g => ({ genre: g.genre, plays: g.plays, share: total ? g.plays / total : 0, topArtists: top(g.artists, 3) })),
    };
  });

  // #5 comebacks: longest gap between two plays of an artist
  const comebacks = top([...artists.values()].filter(a => a.plays >= COMEBACK_MIN_PLAYS).map(a => {
    let best = { days: 0 };
    for (let i = 1; i < a.dates.length; i++) {
      const days = dayDiff(a.dates[i - 1], a.dates[i]);
      if (days > best.days) best = { days, from: a.dates[i - 1], to: a.dates[i] };
    }
    return { id: a.id, plays: a.plays, ...best };
  }), 15, 'days');

  // #6 forgotten favourites: not played for a year or more (the page filters 1/2/3 years)
  const yearAgo = new Date(now.getTime() - 365 * DAY_MS).toISOString().slice(0, 10);
  const forgotten = top([...tracks.values()].filter(t => t.plays >= FORGOTTEN_MIN_PLAYS && t.last < yearAgo), 50).map(t => ({ id: t.id, plays: t.plays, lastPlayed: t.last }));

  // #7 discovery: artists found per year (year they were first played, if they reached 20 plays)
  const found = [...artists.values()].filter(a => a.plays >= DISCOVERY_MIN_PLAYS).map(a => ({ id: a.id, plays: a.plays, firstPlayed: first.get(a.id).date, via: first.get(a.id).trackId }));
  const discovery = yearRows.map(({ _id: year }) => {
    const inYear = found.filter(a => Number(a.firstPlayed.slice(0, 4)) === year);
    return { year, count: inYear.length, biggest: top(inYear, 5) };
  });

  // #8 obsession days: most plays of one track in a day
  const obsessions = top([...tracks.values()].map(t => ({ id: t.id, date: t.bestDay.date, plays: t.bestDay.plays })), 15);

  // #9 listening clock, all time (per artist/year: listeningClock)
  const byHour = Array(24).fill(0), byWeekday = Array(7).fill(0);
  for (const { _id, plays: n } of clock) {
    byHour[_id.h] += n;
    byWeekday[_id.w - 1] += n;
  }

  // #11 seasonal artists
  const seasonal = Object.fromEntries(['winter', 'spring', 'summer', 'autumn'].map(season => [
    season,
    top([...artists.values()].filter(a => a.plays >= SEASONAL_MIN_PLAYS).map(a => ({ id: a.id, plays: a.plays, seasonPlays: a.seasons[season] ?? 0, share: (a.seasons[season] ?? 0) / a.plays })), 10, 'share'),
  ]));

  // #12 travel soundtrack (export plays only: recently played has no country)
  const travel = top(countries, 50).map(c => ({
    country: c._id,
    plays: c.plays,
    years: [...c.years].sort(),
    topArtists: top(countryArtists.filter(r => r._id.c === c._id).map(r => ({ id: r._id.a, plays: r.plays })), 5),
  }));

  // #13 streaks
  const streaks = {
    overall: { ...longestStreak(activeDates), activeDays: activeDates.length },
    artists: top([...artists.values()].map(a => ({ id: a.id, ...longestStreak(a.dates) })), 10, 'days'),
  };

  // #14 how old is the music: plays per release year, per listening year
  const age = yearRows.map(({ _id: year }) => {
    const rows = ages.filter(r => r._id.y === year).sort((a, b) => a._id.r - b._id.r);
    const total = rows.reduce((sum, r) => sum + r.plays, 0);
    let seen = 0, median = null;
    for (const r of rows) {
      seen += r.plays;
      if (median === null && seen >= total / 2) median = year - r._id.r;
    }
    const share = test => (total ? rows.filter(r => test(year - r._id.r)).reduce((s, r) => s + r.plays, 0) / total : 0);
    return { year, medianAge: median, sameYearShare: share(a => a <= 0), tenPlusShare: share(a => a >= 10), byReleaseYear: rows.map(r => ({ releaseYear: r._id.r, plays: r.plays })) };
  });

  // #15 ride or die: artists played in the most distinct years
  const rideOrDie = [...artists.values()]
    .map(a => ({ id: a.id, plays: a.plays, years: [...new Set(a.dates.map(d => Number(d.slice(0, 4))))].sort() }))
    .sort((a, b) => b.years.length - a.years.length || b.plays - a.plays)
    .slice(0, 15);

  // #16 skip rate (the page filters by minimum plays)
  const skipRate = artistStarts.map(a => ({ id: a._id, starts: a.starts, plays: a.plays, skipRate: 1 - a.plays / a.starts })).sort((a, b) => b.skipRate - a.skipRate);

  // #17 longest sessions
  const longestSessions = top(sessions.map(s => ({ start: new Date(s.start).toISOString(), end: new Date(s.end).toISOString(), hours: (s.end - s.start) / 36e5, plays: s.plays })), 5, 'hours');

  // Names and images for everything above
  const L = await labels(prisma, {
    artistIds: [
      ...eras.flatMap(e => e.topArtists.map(a => a.id)),
      ...genres.flatMap(y => y.genres.flatMap(g => g.topArtists.map(a => a.id))),
      ...comebacks.map(a => a.id),
      ...discovery.flatMap(y => y.biggest.map(a => a.id)),
      ...Object.values(seasonal).flat().map(a => a.id),
      ...travel.flatMap(c => c.topArtists.map(a => a.id)),
      ...streaks.artists.map(a => a.id),
      ...rideOrDie.map(a => a.id),
      ...skipRate.map(a => a.id),
    ],
    trackIds: [
      ...eras.map(e => e.topTrack?.id).filter(Boolean),
      ...forgotten.map(t => t.id),
      ...discovery.flatMap(y => y.biggest.map(a => a.via)),
      ...obsessions.map(t => t.id),
    ],
  });
  const withArtist = a => ({ ...a, ...L.artist(a.id) });
  const withTrack = t => ({ ...t, ...L.track(t.id) });

  const totalMs = yearRows.reduce((sum, y) => sum + y.ms, 0);
  return {
    totals: {
      plays: yearRows.reduce((sum, y) => sum + y.plays, 0),
      starts: yearRows.reduce((sum, y) => sum + y.starts, 0),
      hours: hours(totalMs),
      artists: artists.size,
      tracks: tracks.size,
      firstPlay: plays[0]?.playedAt.toISOString() ?? null,
      lastPlay: plays.at(-1)?.playedAt.toISOString() ?? null,
      accountGaps: gaps,
    },
    eras: eras.map(e => ({ ...e, topArtists: e.topArtists.map(withArtist), topTrack: e.topTrack && withTrack(e.topTrack) })),
    genres: genres.map(y => ({ ...y, genres: y.genres.map(g => ({ ...g, topArtists: g.topArtists.map(withArtist) })) })),
    comebacks: comebacks.map(withArtist),
    forgotten: forgotten.map(withTrack),
    discovery: discovery.map(y => ({ ...y, biggest: y.biggest.map(a => ({ ...withArtist(a), via: L.track(a.via) })) })),
    obsessions: obsessions.map(withTrack),
    clock: { byHour, byWeekday },
    seasonal: Object.fromEntries(Object.entries(seasonal).map(([s, rows]) => [s, rows.map(withArtist)])),
    travel: travel.map(c => ({ ...c, topArtists: c.topArtists.map(withArtist) })),
    streaks: { overall: streaks.overall, artists: streaks.artists.map(withArtist) },
    age,
    rideOrDie: rideOrDie.map(withArtist),
    skipRate: skipRate.map(withArtist),
    sessions: { longest: longestSessions },
    daily,
  };
}

// Recomputes the fixed stats and stores them. Called once a day by the collector, after the
// top-items sync, and by `npm run history:rebuild`.
export async function storeHistoryStats(prisma, userId, now = new Date()) {
  const stats = await computeHistoryStats(prisma, userId, now);
  await prisma.historyStats.upsert({
    where: { userId },
    create: { userId, computedAt: now, factsUpdatedAt: now, stats },
    update: { computedAt: now, stats },
  });
  return stats;
}

// --- Interactive stats -----------------------------------------------------------------------
// Inputs are validated by the API routes (src/app/api/history/*); results are CDN-cached per
// data version.

function rankArtists(n) {
  return [{ $unwind: '$artistIds' }, { $group: { _id: '$artistIds', plays: { $sum: 1 } } }, { $sort: { plays: -1, _id: 1 } }, { $limit: n }];
}
function rankTracks(n) {
  return [{ $group: { _id: '$trackId', plays: { $sum: 1 } } }, { $sort: { plays: -1, _id: 1 } }, { $limit: n }];
}

// #1 top of any slice. Every filter is optional: year, month (1-12, alone = that month in every
// year), hours [from, to] (local, inclusive; from > to wraps past midnight), country.
export async function topOfSlice(prisma, userId, { year, month, hours: hourRange, country, limit = 10 } = {}) {
  const filter = { counted: true };
  if (year) filter.year = year;
  if (month) filter.month = month;
  if (country) filter.country = country;
  if (hourRange) {
    const [from, to] = hourRange;
    filter.hour = from <= to ? { $gte: from, $lte: to } : { $not: { $gt: to, $lt: from } };
  }
  const [artists, tracks, totals] = await Promise.all([
    aggregate(prisma, userId, [{ $match: filter }, ...rankArtists(limit)]),
    aggregate(prisma, userId, [{ $match: filter }, ...rankTracks(limit)]),
    aggregate(prisma, userId, [{ $match: filter }, { $group: { _id: null, plays: { $sum: 1 }, ms: { $sum: '$listenedMs' } } }]),
  ]);
  const L = await labels(prisma, { artistIds: artists.map(a => a._id), trackIds: tracks.map(t => t._id) });
  return {
    plays: totals[0]?.plays ?? 0,
    hours: hours(totals[0]?.ms ?? 0),
    topArtists: artists.map(a => ({ ...L.artist(a._id), plays: a.plays })),
    topTracks: tracks.map(t => ({ ...L.track(t._id), plays: t.plays })),
  };
}

// #3 artist deep dive. Returns null if the artist has no counted plays.
export async function artistDeepDive(prisma, userId, artistId) {
  const match = { $match: { counted: true, artistIds: artistId } };
  const [firstPlay, perYear, perMonth, tracks, days, clock, totals] = await Promise.all([
    aggregate(prisma, userId, [match, { $sort: { playedAt: 1 } }, { $limit: 1 }, { $project: { date: 1, trackId: 1 } }]),
    aggregate(prisma, userId, [match, { $group: { _id: '$year', plays: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    aggregate(prisma, userId, [match, { $group: { _id: { y: '$year', m: '$month' }, plays: { $sum: 1 } } }, { $sort: { plays: -1 } }, { $limit: 1 }]),
    aggregate(prisma, userId, [match, ...rankTracks(5)]),
    aggregate(prisma, userId, [match, { $group: { _id: '$date' } }, { $sort: { _id: 1 } }]),
    aggregate(prisma, userId, [match, { $group: { _id: '$hour', plays: { $sum: 1 } } }]),
    aggregate(prisma, userId, [match, { $group: { _id: null, plays: { $sum: 1 }, ms: { $sum: '$listenedMs' }, last: { $max: '$date' } } }]),
  ]);
  if (!firstPlay.length) return null;
  const L = await labels(prisma, { artistIds: [artistId], trackIds: [firstPlay[0].trackId, ...tracks.map(t => t._id)] });
  const byHour = Array(24).fill(0);
  for (const h of clock) byHour[h._id] = h.plays;
  return {
    artist: L.artist(artistId),
    plays: totals[0].plays,
    hours: hours(totals[0].ms),
    firstPlayed: { date: firstPlay[0].date, via: L.track(firstPlay[0].trackId) },
    lastPlayed: totals[0].last,
    perYear: perYear.map(y => ({ year: y._id, plays: y.plays })),
    peakMonth: { year: perMonth[0]._id.y, month: perMonth[0]._id.m, plays: perMonth[0].plays },
    topTracks: tracks.map(t => ({ ...L.track(t._id), plays: t.plays })),
    longestStreak: longestStreak(days.map(d => d._id)),
    byHour,
  };
}

// #9 listening clock for one artist and/or year (all time is in the fixed stats)
export async function listeningClock(prisma, userId, { artistId, year } = {}) {
  const filter = { counted: true };
  if (artistId) filter.artistIds = artistId;
  if (year) filter.year = year;
  const rows = await aggregate(prisma, userId, [{ $match: filter }, { $group: { _id: { h: '$hour', w: '$weekday' }, plays: { $sum: 1 } } }]);
  const byHour = Array(24).fill(0), byWeekday = Array(7).fill(0);
  for (const { _id, plays } of rows) {
    byHour[_id.h] += plays;
    byWeekday[_id.w - 1] += plays;
  }
  return { byHour, byWeekday };
}

// #10 on this day: each past year's plays on a calendar date, with its most played track and artist
export async function onThisDay(prisma, userId, { month, day }) {
  const match = { $match: { counted: true, month, day } };
  const [years, tracks, artists] = await Promise.all([
    aggregate(prisma, userId, [match, { $group: { _id: '$year', plays: { $sum: 1 }, ms: { $sum: '$listenedMs' } } }, { $sort: { _id: 1 } }]),
    aggregate(prisma, userId, [match, { $group: { _id: { y: '$year', t: '$trackId' }, plays: { $sum: 1 } } }, { $sort: { plays: -1, '_id.t': 1 } }]),
    aggregate(prisma, userId, [match, { $unwind: '$artistIds' }, { $group: { _id: { y: '$year', a: '$artistIds' }, plays: { $sum: 1 } } }, { $sort: { plays: -1, '_id.a': 1 } }]),
  ]);
  const topTrack = y => tracks.find(t => t._id.y === y);
  const topArtist = y => artists.find(a => a._id.y === y);
  const L = await labels(prisma, { artistIds: years.map(y => topArtist(y._id)._id.a), trackIds: years.map(y => topTrack(y._id)._id.t) });
  return years.map(y => ({
    year: y._id,
    plays: y.plays,
    hours: Math.round(y.ms / 36e4) / 10,
    topTrack: { ...L.track(topTrack(y._id)._id.t), plays: topTrack(y._id).plays },
    topArtist: { ...L.artist(topArtist(y._id)._id.a), plays: topArtist(y._id).plays },
  }));
}
