import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/apiUtils';
import { getOwner } from '@/lib/owner';
import { NowPlaying } from '@/types/spotify';

export const dynamic = 'force-dynamic';

// Public: every visitor polls this every 5s, so Vercel's CDN serves one answer to all of them
// for 5s and Spotify sees about one call per 5s however many people are watching
const CDN_CACHE = 'public, max-age=0, s-maxage=5';

export async function GET() {
  try {
    const { spotify } = await getOwner();
    // Spotify answers 204 with an empty body when nothing is playing
    const current = await spotify.getCurrentTrack();
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
    return NextResponse.json(nowPlaying, { status: 200, headers: { 'Cache-Control': CDN_CACHE } });
  } catch (error) {
    return handleApiError(error);
  }
}
