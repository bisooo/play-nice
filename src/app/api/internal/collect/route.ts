import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/apiUtils';
import { getOwner } from '@/lib/owner';
import { prisma } from '@/lib/prisma';
import { storeHistoryStats } from '@/lib/historyStats.mjs';
import { UserService } from '@/services/userServices';

export const dynamic = 'force-dynamic';
// Hobby's default is 10s; a full top-items sync plus plays can come close
export const maxDuration = 60;

// A little under a day, so the hourly schedule's jitter doesn't push it to every 25h
const STATS_INTERVAL_MS = 23 * 60 * 60 * 1000;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// Scheduled collector (.github/workflows/collect-listening.yml, hourly). Not for visitors:
// needs `Authorization: Bearer $CRON_SECRET`. Saves new plays from recently played, and
// syncs top items (which snapshots them) when they're over 24h old, so history keeps
// building on days nobody opens the site. Recomputes the fixed history stats once a day.
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { user, spotify } = await getOwner();

    // Run both even if one fails (e.g. a token minted without user-read-recently-played)
    const [topItems, plays] = await Promise.allSettled([
      UserService.syncTopItemsIfStale(user, spotify),
      UserService.recordRecentPlays(user.id, spotify),
    ]);

    const failed = [topItems, plays].find((result): result is PromiseRejectedResult => result.status === 'rejected');
    if (failed) {
      console.error('Error collecting listening:', failed.reason);
      return handleApiError(failed.reason);
    }
    const stats = await prisma.historyStats.findUnique({ where: { userId: user.id }, select: { computedAt: true } });
    // No row until the prepared plays are first built (npm run history:rebuild)
    const statsStale = !!stats && (!stats.computedAt || Date.now() - stats.computedAt.getTime() > STATS_INTERVAL_MS);
    if (statsStale) await storeHistoryStats(prisma, user.id);

    return NextResponse.json({
      topItemsSynced: topItems.status === 'fulfilled' && topItems.value,
      plays: plays.status === 'fulfilled' && plays.value,
      historyStatsComputed: statsStale,
    });
  } catch (error) {
    console.error('Error collecting listening:', error);
    return handleApiError(error);
  }
}
