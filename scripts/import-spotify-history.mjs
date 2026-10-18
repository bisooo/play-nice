// Imports Spotify's Extended Streaming History export into the listening history and brings the
// whole history to the current data model (docs/data-model.md). Safe to rerun.
//
//   npm run history:import -- ~/Downloads/my_spotify_data.zip     (the zip or the unzipped folder)
//
// Run from the repo root; reads DATABASE_URL, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET and
// SPOTIFY_REFRESH_TOKEN from the environment or .env.local. Steps:
//   1. prisma db push (adds the catalog collections and the new Play index)
//   2. converts plays saved before the catalog existed (track details on each play) to the new shape
//   3. imports the export's music plays, merging with plays the hourly collector already has
//   4. looks up every track and artist on Spotify (artists, album, length, images, genres)
//   5. merges artist aliases (ARTIST_ALIASES, e.g. Ye into Kanye West) on tracks stored earlier

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import prismaPkg from '@prisma/client';
import { bulkUpdate, cleanExportRows, enrichArtists, enrichTracks, importExportPlays, mergeArtistAliases } from '../src/lib/listeningHistory.mjs';

const { PrismaClient } = prismaPkg;

for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
for (const name of ['DATABASE_URL', 'SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REFRESH_TOKEN']) {
  if (!process.env[name]) fail(`${name} is not set (run from the repo root with .env.local)`);
}

const input = process.argv[2];
if (!input || !existsSync(input)) fail('Usage: npm run history:import -- <my_spotify_data.zip or its folder>');

function fail(message) {
  console.error(message);
  process.exit(1);
}

// --- Spotify -----------------------------------------------------------------------------

let accessToken;
async function refreshToken() {
  const auth = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: process.env.SPOTIFY_REFRESH_TOKEN }),
  });
  if (!response.ok) fail(`Spotify token refresh failed: ${response.status} ${await response.text()}`);
  accessToken = (await response.json()).access_token;
}

// Waits out 429s (Retry-After) and refreshes the token once on a 401
async function spotifyGet(path, retried = false) {
  const response = await fetch(`https://api.spotify.com/v1/${path}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (response.status === 429) {
    const seconds = Number(response.headers.get('retry-after') ?? 5);
    console.log(`  rate limited, waiting ${seconds}s`);
    await new Promise(resolve => setTimeout(resolve, (seconds + 1) * 1000));
    return spotifyGet(path, retried);
  }
  if (response.status === 401 && !retried) {
    await refreshToken();
    return spotifyGet(path, true);
  }
  if (!response.ok) throw new Error(`Spotify ${response.status} on ${path.split('?')[0]}: ${await response.text()}`);
  return response.json();
}

// --- Export files ------------------------------------------------------------------------

function exportFiles(folder) {
  const found = [];
  for (const entry of readdirSync(folder)) {
    const path = join(folder, entry);
    if (statSync(path).isDirectory()) found.push(...exportFiles(path));
    else if (/^Streaming_History_Audio_.*\.json$/.test(entry)) found.push(path);
  }
  return found.sort();
}

// --- Plays saved before the catalog ------------------------------------------------------

// The first collector (2026-10-16) stored track details on each play. Moves them into Track
// stubs (enrichment fills in the rest), estimates msPlayed like the collector now does, and
// removes the old fields.
async function migrateLegacyPlays(prisma) {
  const legacy = await prisma.play.findRaw({ filter: { trackName: { $exists: true } } });
  if (legacy.length === 0) return 0;

  const plays = legacy
    .map(doc => ({ ...doc, id: doc._id.$oid, playedAt: new Date(doc.playedAt.$date) }))
    .sort((a, b) => a.playedAt - b.playedAt);

  const known = new Set((await prisma.track.findMany({ select: { id: true } })).map(t => t.id));
  const stubs = new Map();
  for (const play of plays) {
    if (known.has(play.trackId) || stubs.has(play.trackId)) continue;
    stubs.set(play.trackId, {
      id: play.trackId,
      name: play.trackName,
      artistIds: (play.artists ?? []).map(a => a.spotifyId),
      albumId: play.albumId ?? null,
      durationMs: play.durationMs ?? null,
    });
  }
  if (stubs.size) await prisma.track.createMany({ data: [...stubs.values()] });

  await bulkUpdate(prisma, 'Play', plays.map((play, index) => {
    const gap = index > 0 ? play.playedAt - plays[index - 1].playedAt : null;
    return {
      q: { _id: { $oid: play.id } },
      u: {
        $set: { msPlayed: gap === null ? null : Math.min(gap, play.durationMs ?? gap), msPlayedEstimated: true },
        $unset: { trackName: '', artists: '', albumId: '', albumName: '', imageUrl: '', durationMs: '' },
      },
    };
  }));
  return plays.length;
}

// --- Run ---------------------------------------------------------------------------------

const db = new URL(process.env.DATABASE_URL);
console.log(`Database: ${db.host}${db.pathname}`);

console.log('1/5 Updating the database schema');
execFileSync('npx', ['prisma', 'db', 'push', '--skip-generate'], { stdio: 'inherit', env: process.env });

const prisma = new PrismaClient();
try {
  await refreshToken();
  const me = await spotifyGet('me');
  const owner = await prisma.user.findUnique({ where: { spotifyId: me.id } });
  if (!owner) fail(`No user row for Spotify account ${me.id} yet: open the app once so it creates it, then rerun.`);
  console.log(`  Spotify account: ${me.id}`);

  console.log('2/5 Converting plays saved before the catalog');
  console.log(`  ${await migrateLegacyPlays(prisma)} converted`);

  console.log('3/5 Importing the export');
  let folder = input;
  let unzipped;
  if (statSync(input).isFile()) {
    unzipped = folder = mkdtempSync(join(tmpdir(), 'spotify-export-'));
    execFileSync('unzip', ['-q', input, '-d', folder]);
  }
  const files = exportFiles(folder);
  if (files.length === 0) fail('No Streaming_History_Audio_*.json files found');
  const rows = files.flatMap(file => JSON.parse(readFileSync(file, 'utf8')));
  if (unzipped) rmSync(unzipped, { recursive: true, force: true });
  const plays = cleanExportRows(rows);
  console.log(`  ${files.length} files, ${rows.length} rows, ${plays.length} music plays after cleaning`);
  const result = await importExportPlays(prisma, owner.id, plays);
  console.log(`  ${result.inserted} added, ${result.merged} merged with collected plays, ${result.skipped} already imported, ${result.newTracks} new tracks`);

  console.log('4/5 Looking up tracks and artists on Spotify');
  console.log(`  ${await enrichTracks(prisma, spotifyGet)} tracks`);
  console.log(`  ${await enrichArtists(prisma, spotifyGet)} artists`);

  console.log('5/5 Merging artist aliases');
  console.log(`  ${await mergeArtistAliases(prisma)} tracks updated`);

  const [bySource, first, last, tracks, unmatched, artists] = await Promise.all([
    prisma.play.groupBy({ by: ['source'], where: { userId: owner.id }, _count: true }),
    prisma.play.findFirst({ where: { userId: owner.id }, orderBy: { playedAt: 'asc' } }),
    prisma.play.findFirst({ where: { userId: owner.id }, orderBy: { playedAt: 'desc' } }),
    prisma.track.count(),
    prisma.track.count({ where: { artistIds: { isEmpty: true } } }),
    prisma.artist.count(),
  ]);
  console.log('Done.');
  console.log(`  plays: ${bySource.map(s => `${s._count} ${s.source}`).join(', ')} (${first?.playedAt.toISOString()} to ${last?.playedAt.toISOString()})`);
  console.log(`  catalog: ${tracks} tracks (${unmatched} Spotify no longer has, kept with export names), ${artists} artists`);
} finally {
  await prisma.$disconnect();
}
