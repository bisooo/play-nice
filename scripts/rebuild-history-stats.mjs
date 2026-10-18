// Updates the schema, then rebuilds the prepared plays (PlayFact) and the fixed history stats
// from scratch. Run once after they're first deployed (the hourly job waits for it), and after
// changing a stats rule (time zone, cap, artist aliases) or the PlayFact shape. Safe to rerun.
//
//   npm run history:rebuild
//
// Run from the repo root; reads DATABASE_URL and SPOTIFY_REFRESH_TOKEN (to find the owner's
// row) from the environment or .env.local.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import prismaPkg from '@prisma/client';
import { refreshPlayFacts } from '../src/lib/listeningHistory.mjs';
import { storeHistoryStats } from '../src/lib/historyStats.mjs';

const { PrismaClient } = prismaPkg;

for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
for (const name of ['DATABASE_URL', 'SPOTIFY_REFRESH_TOKEN']) {
  if (!process.env[name]) {
    console.error(`${name} is not set (run from the repo root with .env.local)`);
    process.exit(1);
  }
}

const db = new URL(process.env.DATABASE_URL);
console.log(`Database: ${db.host}${db.pathname}`);
console.log('1/3 Updating the database schema');
execFileSync('npx', ['prisma', 'db', 'push', '--skip-generate'], { stdio: 'inherit', env: process.env });

const prisma = new PrismaClient();
try {
  const owner = await prisma.user.findFirst({ where: { refreshToken: process.env.SPOTIFY_REFRESH_TOKEN } });
  if (!owner) throw new Error('No user row for SPOTIFY_REFRESH_TOKEN yet: open the app once so it creates it, then rerun.');

  let started = Date.now();
  console.log(`2/3 Prepared plays: ${await refreshPlayFacts(prisma, owner.id)} rebuilt in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  started = Date.now();
  const stats = await storeHistoryStats(prisma, owner.id);
  console.log(`3/3 Fixed stats computed in ${((Date.now() - started) / 1000).toFixed(1)}s (${stats.totals.plays} counted plays, ${stats.totals.hours} hours)`);
} finally {
  await prisma.$disconnect();
}
