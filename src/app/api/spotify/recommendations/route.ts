import { SpotifyService } from '@/lib/spotifyService';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { handleApiError } from '@/lib/apiUtils';
import { TrackParams } from '@/types/spotifyTypes';
import { markets } from '@/lib/constants';

function getTrackParams(searchParams: URLSearchParams): TrackParams {
  return {
    seed_genres: searchParams.get('genre') ?? "hip-hop",
    target_tempo: searchParams.get('tempo') ?? "120",
    target_energy: searchParams.get('energy') ?? "0.5",
    target_acousticness: searchParams.get('acousticness') ?? "0.5",
    target_danceability: searchParams.get('danceability') ?? "0.5",
    target_instrumentalness: searchParams.get('instrumentalness') ?? "0.5",
    target_liveness: searchParams.get('liveness') ?? "0.5",
    target_speechiness: searchParams.get('speechiness') ?? "0.5",
    target_popularity: searchParams.get('popularity') ?? "50",
    market: markets[Math.floor(Math.random() * markets.length)],
    limit: '9',
    offset: Math.floor(Math.random() * 100).toString()
  };
}
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const spotifyApi = new SpotifyService(session);
  const trackParams = getTrackParams(req.nextUrl.searchParams);
  
  try {
    const recommendations = await spotifyApi.getRecommendations(trackParams);
    return NextResponse.json(recommendations, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}