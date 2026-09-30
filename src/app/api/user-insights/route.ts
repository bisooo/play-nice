import { NextRequest, NextResponse } from 'next/server';
import UserManager from '@/lib/userManager';
import { TimeRange } from '@prisma/client';
import { handleApiError } from '@/lib/apiUtils';
import { getOwnerUser } from '@/lib/owner';

export const dynamic = 'force-dynamic';

// Public: the owner's top items for one time range, straight from the DB
export async function GET(request: NextRequest) {
  const timeRange = request.nextUrl.searchParams.get('timeRange');

  if (!timeRange || !['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'].includes(timeRange)) {
    return NextResponse.json({ error: 'Invalid time range' }, { status: 400 });
  }

  try {
    const owner = await getOwnerUser();
    if (!owner) {
      // No sync has run yet
      return NextResponse.json({ topArtists: [], topTracks: [] });
    }
    const topArtists = await UserManager.getTopArtists(owner.spotifyId, timeRange as TimeRange);
    const topTracks = await UserManager.getTopTracks(owner.spotifyId, timeRange as TimeRange);

    return NextResponse.json({ topArtists, topTracks });
  } catch (error) {
    console.error('Error fetching user insights:', error);
    return handleApiError(error);
  }
}
