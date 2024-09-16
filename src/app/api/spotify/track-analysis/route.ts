import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { SpotifyService } from '@/lib/spotifyService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const track = searchParams.get('track');
    const artist = searchParams.get('artist');

    if (!track || !artist) {
      return NextResponse.json({ error: 'Track and artist are required' }, { status: 400 });
    }

    const spotifyService = new SpotifyService(session);

    // Search for the track
    const searchData = await spotifyService.searchTrack(track, artist);
    
    if (!searchData.tracks || searchData.tracks.items.length === 0) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    const trackId = searchData.tracks.items[0].id;

    // Get audio features for the track
    const featuresData = await spotifyService.getAudioFeatures(trackId);

    return NextResponse.json(featuresData);
  } catch (error) {
    console.error('Error in track analysis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}