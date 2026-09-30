import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import UserManager from '@/lib/userManager';
import { TimeRange } from '@prisma/client';
import { authOptions } from '@/lib/authOptions';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const timeRange = request.nextUrl.searchParams.get('timeRange');
  const spotifyId = session.id;

  if (!timeRange || !['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'].includes(timeRange)) {
    return NextResponse.json({ error: 'Invalid time range' }, { status: 400 });
  }

  if (!spotifyId) {
    return NextResponse.json({ error: 'Spotify ID is missing' }, { status: 400 });
  }

  try {
    const topArtists = await UserManager.getTopArtists(spotifyId, timeRange as TimeRange);
    const topTracks = await UserManager.getTopTracks(spotifyId, timeRange as TimeRange);

    return NextResponse.json({ topArtists, topTracks });
  } catch (error) {
    console.error('Error fetching user insights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}