import { SpotifyService } from '@/lib/spotifyService';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { handleApiError } from '@/lib/apiUtils';
import { NowPlaying } from '@/types/spotify';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const spotifyApi = new SpotifyService(session);

  try {
    // Spotify answers 204 with an empty body when nothing is playing
    const current = await spotifyApi.getCurrentTrack();
    const item = current?.item;
    const nowPlaying: NowPlaying = {
      isPlaying: Boolean(current?.is_playing),
      progressMs: current?.progress_ms ?? 0,
      track: item
        ? {
            id: item.id,
            name: item.name,
            artists: item.artists.map((artist: { name: string }) => artist.name),
            album: item.album.name,
            imageUrl: item.album.images[0]?.url ?? null,
            durationMs: item.duration_ms,
          }
        : null,
    };
    return NextResponse.json(nowPlaying, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
