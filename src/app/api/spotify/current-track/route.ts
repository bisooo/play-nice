import { SpotifyService } from '@lib/spotifyService';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@lib/authOptions';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  console.log("token = " + session?.accessToken);
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const spotifyApi = new SpotifyService(session);

  try {
    const currentTrack = await spotifyApi.getCurrentTrack();
    return NextResponse.json(currentTrack, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
