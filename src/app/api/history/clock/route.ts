import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/apiUtils';
import { badRequest, cached, checkVersion, intParam, SPOTIFY_ID } from '@/lib/historyApi';
import { prisma } from '@/lib/prisma';
import { listeningClock } from '@/lib/historyStats.mjs';

export const dynamic = 'force-dynamic';

// Public: plays per local hour and weekday for an artist and/or year (stat #9; all time is in
// /api/history/stats). ?v=<version>&artist=<id>&year=<yyyy>
export async function GET(request: NextRequest) {
  try {
    const check = await checkVersion(request);
    if (check.error) return check.error;

    const artistId = request.nextUrl.searchParams.get('artist') ?? undefined;
    const year = intParam(request, 'year', 2000, 2100);
    if (artistId !== undefined && !SPOTIFY_ID.test(artistId)) return badRequest('Invalid artist id');
    if (year === null) return badRequest('Invalid year');

    return cached(await listeningClock(prisma, check.userId, { artistId, year }));
  } catch (error) {
    console.error('Error fetching listening clock:', error);
    return handleApiError(error);
  }
}
