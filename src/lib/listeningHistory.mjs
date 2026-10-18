// Listening history core, shared by the hourly collector (src/services/userServices.ts) and the
// export import script (scripts/import-spotify-history.mjs). Plain JS so the script runs with
// plain node. Data model: docs/data-model.md.
//
// `prisma` is a PrismaClient; `spotifyGet(path)` returns the parsed JSON of a GET to
// https://api.spotify.com/v1/<path> and throws on errors.

const BATCH = 50; // max ids per GET /tracks?ids= and /artists?ids=
const SAME_PLAY_MS = 1000; // the export's ts has second precision, the API's played_at has ms

const asDate = value => (value instanceof Date ? value : new Date(value));

// --- Catalog -----------------------------------------------------------------------------

// Track, album and artist (id + name) records from full Spotify track objects. Artists from a
// track object have no images or genres, so they're left for enrichArtists.
export async function upsertCatalogFromTracks(prisma, tracks, now = new Date()) {
  const unique = [...new Map(tracks.filter(t => t?.id).map(t => [t.id, t])).values()];
  if (unique.length === 0) return;

  const albums = new Map();
  const artists = new Map();
  for (const track of unique) {
    if (track.album?.id) albums.set(track.album.id, track.album);
    for (const artist of track.artists ?? []) if (artist.id) artists.set(artist.id, artist);
  }

  await bulkUpdate(prisma, 'Track', unique.map(track => ({
    q: { _id: track.id },
    u: {
      $set: {
        name: track.name,
        artistIds: (track.artists ?? []).map(a => a.id).filter(Boolean),
        albumId: track.album?.id ?? null,
        durationMs: track.duration_ms ?? null,
        enrichedAt: { $date: now.toISOString() },
      },
    },
    upsert: true,
  })));

  await bulkUpdate(prisma, 'Album', [...albums.values()].map(album => ({
    q: { _id: album.id },
    u: {
      $set: {
        name: album.name,
        imageUrl: album.images?.[0]?.url ?? null,
        releaseDate: album.release_date ?? null,
      },
    },
    upsert: true,
  })));

  // Name only; keep images/genres/enrichedAt from an earlier enrichment
  await bulkUpdate(prisma, 'Artist', [...artists.values()].map(artist => ({
    q: { _id: artist.id },
    u: { $set: { name: artist.name }, $setOnInsert: { genres: [] } },
    upsert: true,
  })));
}

// Fills in tracks that only have export names (no artists/album/length yet). Returns how many
// were looked up. Spotify returns null for ids it no longer has; those keep their export names
// and get enrichedAt so they aren't retried every run.
export async function enrichTracks(prisma, spotifyGet, limit = Infinity) {
  let done = 0;
  while (done < limit) {
    const pending = await prisma.track.findMany({
      where: { enrichedAt: { isSet: false } },
      select: { id: true },
      take: Math.min(BATCH, limit - done),
    });
    if (pending.length === 0) break;

    const ids = pending.map(t => t.id);
    const { tracks } = await spotifyGet(`tracks?ids=${ids.join(',')}`);
    const now = new Date();
    await upsertCatalogFromTracks(prisma, tracks, now);
    const missing = ids.filter(id => !tracks.some(t => t?.id === id));
    if (missing.length) {
      await prisma.track.updateMany({ where: { id: { in: missing } }, data: { enrichedAt: now } });
    }
    done += ids.length;
  }
  return done;
}

// Images and genres for artists that only have a name
export async function enrichArtists(prisma, spotifyGet, limit = Infinity) {
  let done = 0;
  while (done < limit) {
    const pending = await prisma.artist.findMany({
      where: { enrichedAt: { isSet: false } },
      select: { id: true },
      take: Math.min(BATCH, limit - done),
    });
    if (pending.length === 0) break;

    const ids = pending.map(a => a.id);
    const { artists } = await spotifyGet(`artists?ids=${ids.join(',')}`);
    const now = { $date: new Date().toISOString() };
    await bulkUpdate(prisma, 'Artist', ids.map(id => {
      const artist = artists.find(a => a?.id === id);
      return {
        q: { _id: id },
        u: {
          $set: artist
            ? { name: artist.name, imageUrl: artist.images?.[0]?.url ?? null, genres: artist.genres ?? [], enrichedAt: now }
            : { enrichedAt: now },
        },
      };
    }));
    done += ids.length;
  }
  return done;
}

// --- Plays -------------------------------------------------------------------------------

// Plays already stored near these times, keyed so a play matches whether it came from the API
// (ms precision) or the export (second precision): same track, within a second.
async function storedPlaysNear(prisma, userId, plays) {
  if (plays.length === 0) return [];
  const times = plays.map(p => p.playedAt.getTime());
  return prisma.play.findMany({
    where: {
      userId,
      playedAt: { gte: new Date(Math.min(...times) - SAME_PLAY_MS), lte: new Date(Math.max(...times) + SAME_PLAY_MS) },
    },
    select: { id: true, playedAt: true, trackId: true, source: true, msPlayed: true },
  });
}

function findSame(stored, play) {
  return stored.find(s => s.trackId === play.trackId && Math.abs(s.playedAt.getTime() - play.playedAt.getTime()) < SAME_PLAY_MS);
}

// Saves recently-played items not stored yet. msPlayed is estimated from the previous play:
// played_at is when a play ended, so time since the previous play ≈ time listened (capped at
// the track's length; overestimates if paused). Checked against the export: 35/36 agreed.
export async function recordRecentlyPlayed(prisma, userId, items) {
  const tracks = items.map(i => i.track).filter(t => t?.id); // local files have no id
  await upsertCatalogFromTracks(prisma, tracks);

  const plays = items
    .filter(i => i.track?.id)
    .map(i => ({
      playedAt: asDate(i.played_at),
      trackId: i.track.id,
      durationMs: i.track.duration_ms,
      contextType: i.context?.type ?? null,
      contextUri: i.context?.uri ?? null,
    }))
    .sort((a, b) => a.playedAt - b.playedAt);

  const stored = await storedPlaysNear(prisma, userId, plays);
  const fresh = plays.filter(p => !findSame(stored, p));
  if (fresh.length === 0) return { fetched: items.length, added: 0 };

  const earliest = fresh[0].playedAt;
  const before = await prisma.play.findFirst({
    where: { userId, playedAt: { lt: earliest } },
    orderBy: { playedAt: 'desc' },
    select: { playedAt: true },
  });
  const all = [...plays].sort((a, b) => a.playedAt - b.playedAt);
  const data = fresh.map(play => {
    const index = all.indexOf(play);
    const previous = index > 0 ? all[index - 1].playedAt : before?.playedAt;
    const gap = previous ? play.playedAt - previous : null;
    return {
      userId,
      playedAt: play.playedAt,
      trackId: play.trackId,
      msPlayed: gap === null ? null : Math.min(gap, play.durationMs ?? gap),
      msPlayedEstimated: true,
      contextType: play.contextType,
      contextUri: play.contextUri,
      source: 'RECENTLY_PLAYED',
    };
  });

  await insertPlays(prisma, data);
  return { fetched: items.length, added: data.length };
}

// One batch insert. If a concurrent run inserted some first, the unique (userId, playedAt,
// trackId) rejects the batch and we insert one by one, skipping what's there.
async function insertPlays(prisma, data) {
  try {
    await prisma.play.createMany({ data });
  } catch (error) {
    if (error?.code !== 'P2002') throw error;
    for (const play of data) {
      try {
        await prisma.play.create({ data: play });
      } catch (inner) {
        if (inner?.code !== 'P2002') throw inner;
      }
    }
  }
}

// --- Spotify extended streaming history export ---------------------------------------------

// Rows from Streaming_History_Audio_*.json → cleaned plays. Keeps music only (no podcasts,
// audiobooks, or the video files, which the caller doesn't pass), drops exact duplicates (the
// export repeats some rows) and every field we don't keep (ip, device, shuffle, reasons...).
export function cleanExportRows(rows) {
  const byKey = new Map();
  for (const row of rows) {
    if (!row.spotify_track_uri?.startsWith('spotify:track:')) continue;
    const trackId = row.spotify_track_uri.slice('spotify:track:'.length);
    const play = {
      playedAt: new Date(row.ts),
      trackId,
      msPlayed: row.ms_played,
      country: row.conn_country && row.conn_country !== 'ZZ' ? row.conn_country : null,
      trackName: row.master_metadata_track_name,
      artistName: row.master_metadata_album_artist_name,
      albumName: row.master_metadata_album_album_name,
    };
    const key = `${row.ts}|${trackId}`;
    const existing = byKey.get(key);
    if (!existing || play.msPlayed > existing.msPlayed) byKey.set(key, play);
  }
  return [...byKey.values()].sort((a, b) => a.playedAt - b.playedAt);
}

// Imports cleaned export plays. A play the hourly collector already has gets the export's exact
// msPlayed and country (it keeps its context); one already imported or merged is skipped. Safe
// to rerun.
export async function importExportPlays(prisma, userId, plays) {
  // Catalog stubs for tracks we don't have; enrichTracks fills them in
  const known = new Set((await prisma.track.findMany({ select: { id: true } })).map(t => t.id));
  const stubs = new Map();
  for (const play of plays) {
    if (!known.has(play.trackId) && !stubs.has(play.trackId)) {
      stubs.set(play.trackId, {
        id: play.trackId,
        name: play.trackName ?? 'Unknown',
        artistIds: [],
        exportArtistName: play.artistName,
        exportAlbumName: play.albumName,
      });
    }
  }
  for (const chunk of chunks([...stubs.values()], 1000)) await prisma.track.createMany({ data: chunk });

  const stored = await prisma.play.findMany({
    where: { userId },
    select: { id: true, playedAt: true, trackId: true, msPlayedEstimated: true },
  });
  const storedByTrack = new Map();
  for (const s of stored) {
    if (!storedByTrack.has(s.trackId)) storedByTrack.set(s.trackId, []);
    storedByTrack.get(s.trackId).push(s);
  }

  const inserts = [];
  const merges = [];
  for (const play of plays) {
    const same = findSame(storedByTrack.get(play.trackId) ?? [], play);
    if (!same) {
      inserts.push({
        userId,
        playedAt: play.playedAt,
        trackId: play.trackId,
        msPlayed: play.msPlayed,
        msPlayedEstimated: false,
        country: play.country,
        source: 'EXPORT',
      });
    } else if (same.msPlayedEstimated) {
      merges.push({ q: { _id: { $oid: same.id } }, u: { $set: { msPlayed: play.msPlayed, msPlayedEstimated: false, country: play.country } } });
    }
  }

  for (const chunk of chunks(inserts, 1000)) await insertPlays(prisma, chunk);
  await bulkUpdate(prisma, 'Play', merges);
  return { plays: plays.length, inserted: inserts.length, merged: merges.length, skipped: plays.length - inserts.length - merges.length, newTracks: stubs.size };
}

// --- Helpers -----------------------------------------------------------------------------

export function* chunks(items, size) {
  for (let i = 0; i < items.length; i += size) yield items.slice(i, i + size);
}

// One round trip per 500 updates (Prisma has no bulk upsert for MongoDB)
export async function bulkUpdate(prisma, collection, updates) {
  for (const chunk of chunks(updates, 500)) {
    await prisma.$runCommandRaw({ update: collection, updates: chunk, ordered: false });
  }
}
