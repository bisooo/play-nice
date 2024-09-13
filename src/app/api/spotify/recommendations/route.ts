import { SpotifyService } from '@/lib/spotifyService';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const spotifyApi = new SpotifyService(session);
  const genre = req.nextUrl.searchParams.get('genre') ?? "hip-hop"
  const tempo = req.nextUrl.searchParams.get('tempo') ?? "120"
  const energy = req.nextUrl.searchParams.get('energy') ?? "0.5"
  const acousticness = req.nextUrl.searchParams.get('acousticness') ?? "0.5"
  const danceability = req.nextUrl.searchParams.get('danceability') ?? "0.5"
  const instrumentalness = req.nextUrl.searchParams.get('instrumentalness') ?? "0.5"
  const liveness = req.nextUrl.searchParams.get('liveness') ?? "0.5"
  const speechiness = req.nextUrl.searchParams.get('speechiness') ?? "0.5"
  const popularity = req.nextUrl.searchParams.get('popularity') ?? "50"
  
  try {
    const recommendations = await spotifyApi.getRecommendations(genre, tempo, energy, acousticness, danceability, instrumentalness, liveness, speechiness, popularity);
    return NextResponse.json(recommendations, { status: 200 });
  } catch (error) {
    return NextResponse.json((error as Error).message, { status: 500 });
  }
}
