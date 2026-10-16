import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/apiUtils';
import { getOwner } from '@/lib/owner';
import { UserService } from '@/services/userServices';

export const dynamic = 'force-dynamic';
// Hobby's default is 10s; a full top-items sync plus plays can come close
export const maxDuration = 60;

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
// building on days nobody opens the site.
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
    return NextResponse.json({
      topItemsSynced: topItems.status === 'fulfilled' && topItems.value,
      plays: plays.status === 'fulfilled' && plays.value,
    });
  } catch (error) {
    console.error('Error collecting listening:', error);
    return handleApiError(error);
  }
}
