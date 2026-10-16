import { PlaySource, TimeRange } from '@prisma/client';
import { SpotifyService } from '../lib/spotifyService';
import UserManager from '../lib/userManager';
import { SpotifyArtist, SpotifyRecentlyPlayedResponse, SpotifyTopArtistsResponse, SpotifyTrack } from '@/types/spotify';
import { PlayData } from '@/types/user';

const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

export class UserService {
  // Syncs top items if they're over 24h old; the claim on lastTopItemsUpdate makes concurrent
  // callers (page loads, the scheduled collector) run it at most once. Returns whether it synced.
  static async syncTopItemsIfStale(user: { id: string; spotifyId: string; lastTopItemsUpdate: Date | null }, spotifyService: SpotifyService) {
    const now = new Date();
    const claimed = await UserManager.claimTopItemsSync(user.spotifyId, new Date(now.getTime() - SYNC_INTERVAL_MS), now);
    if (!claimed) return false;

    try {
      await this.updateUserTopItems(user.id, spotifyService, now);
    } catch (error) {
      // Release the claim so the next call retries
      await UserManager.updateLastTopItemsUpdate(user.id, user.lastTopItemsUpdate);
      throw error;
    }
    return true;
  }

  static async updateUserTopItems(userId: string, spotifyService: SpotifyService, capturedAt: Date) {

    const timeRanges: Array<{ spotifyRange: 'short_term' | 'medium_term' | 'long_term', prismaRange: TimeRange }> = [
      { spotifyRange: 'short_term', prismaRange: TimeRange.SHORT_TERM },
      { spotifyRange: 'medium_term', prismaRange: TimeRange.MEDIUM_TERM },
      { spotifyRange: 'long_term', prismaRange: TimeRange.LONG_TERM },
    ];

    for (const { spotifyRange, prismaRange } of timeRanges) {
      await this.updateTopArtists(userId, spotifyService, spotifyRange, prismaRange, capturedAt);
      await this.updateTopTracks(userId, spotifyService, spotifyRange, prismaRange, capturedAt);
    }
  }

  // Saves plays newer than the latest one stored. Spotify only returns the last 50,
  // so anything played between polls beyond that is lost; poll at least every couple of hours.
  static async recordRecentPlays(userId: string, spotifyService: SpotifyService) {
    const recent: SpotifyRecentlyPlayedResponse = await spotifyService.getRecentlyPlayed();
    const latest = await UserManager.getLatestPlayedAt(userId);

    const plays: PlayData[] = recent.items
      .filter(item => item.track?.id)
      .map(item => ({
        playedAt: new Date(item.played_at),
        trackId: item.track.id,
        trackName: item.track.name,
        artists: item.track.artists.map(artist => ({ spotifyId: artist.id, name: artist.name })),
        albumId: item.track.album?.id,
        albumName: item.track.album?.name,
        imageUrl: item.track.album?.images[0]?.url,
        durationMs: item.track.duration_ms,
        contextType: item.context?.type,
        contextUri: item.context?.uri,
        source: PlaySource.RECENTLY_PLAYED,
      }))
      .filter(play => !latest || play.playedAt > latest);

    await UserManager.addPlays(userId, plays);
    return { fetched: recent.items.length, added: plays.length };
  }

  private static async updateTopArtists(userId: string, spotifyService: SpotifyService, spotifyRange: 'short_term' | 'medium_term' | 'long_term', prismaRange: TimeRange, capturedAt: Date) {
    const topArtists: SpotifyTopArtistsResponse = await spotifyService.getTopArtists(spotifyRange);
    const artists = topArtists.items.map((artist: SpotifyArtist, index: number) => ({
      spotifyId: artist.id,
      name: artist.name,
      imageUrl: artist.images[0]?.url,
      genres: artist.genres ?? [],
      rank: index + 1,
    }));

    await UserManager.updateTopArtists(
      userId,
      artists.map((artist, index) => ({ ...artist, popularity: topArtists.items[index].popularity, timeRange: prismaRange })),
      artists,
      prismaRange,
      capturedAt,
    );
  }

  private static async updateTopTracks(userId: string, spotifyService: SpotifyService, spotifyRange: 'short_term' | 'medium_term' | 'long_term', prismaRange: TimeRange, capturedAt: Date) {
    const topTracks = await spotifyService.getTopTracks(spotifyRange);

    await UserManager.updateTopTracks(
      userId,
      topTracks.items.map((track: SpotifyTrack, index: number) => ({
        spotifyId: track.id,
        name: track.name,
        artistName: track.artists[0].name,
        albumName: track.album.name,
        imageUrl: track.album.images[0]?.url,
        popularity: track.popularity,
        timeRange: prismaRange,
        rank: index + 1,
      })),
      topTracks.items.map((track: SpotifyTrack, index: number) => ({
        spotifyId: track.id,
        name: track.name,
        artists: track.artists.map(artist => ({ spotifyId: artist.id, name: artist.name })),
        albumName: track.album.name,
        imageUrl: track.album.images[0]?.url,
        rank: index + 1,
      })),
      prismaRange,
      capturedAt,
    );
  }
}
