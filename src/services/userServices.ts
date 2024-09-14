import { TimeRange } from '@prisma/client';
import { Session } from 'next-auth';
import { SpotifyService } from '../lib/spotifyService';
import UserManager from '../lib/userManager';
import { SpotifyArtist, SpotifyTrack } from '@/types/spotify';

export class UserService {
  static async updateUserTopItems(userId: string, session: Session) {
    const spotifyService = new SpotifyService(session);

    const timeRanges: Array<{ spotifyRange: 'short_term' | 'medium_term' | 'long_term', prismaRange: TimeRange }> = [
      { spotifyRange: 'short_term', prismaRange: TimeRange.SHORT_TERM },
      { spotifyRange: 'medium_term', prismaRange: TimeRange.MEDIUM_TERM },
      { spotifyRange: 'long_term', prismaRange: TimeRange.LONG_TERM },
    ];

    for (const { spotifyRange, prismaRange } of timeRanges) {
      await this.updateTopArtists(userId, spotifyService, spotifyRange, prismaRange);
      await this.updateTopTracks(userId, spotifyService, spotifyRange, prismaRange);
    }
  }

  private static async updateTopArtists(userId: string, spotifyService: SpotifyService, spotifyRange: 'short_term' | 'medium_term' | 'long_term', prismaRange: TimeRange) {
    const topArtists = await spotifyService.getTopArtists(spotifyRange);

    await UserManager.updateTopArtists(userId, topArtists.items.map((artist: SpotifyArtist, index: number) => ({
      spotifyId: artist.id,
      name: artist.name,
      imageUrl: artist.images[0]?.url,
      popularity: artist.popularity,
      genres: artist.genres,
      timeRange: prismaRange,
      rank: index + 1,
    })), prismaRange);
  }

  private static async updateTopTracks(userId: string, spotifyService: SpotifyService, spotifyRange: 'short_term' | 'medium_term' | 'long_term', prismaRange: TimeRange) {
    const topTracks = await spotifyService.getTopTracks(spotifyRange);

    await UserManager.updateTopTracks(userId, topTracks.items.map((track: SpotifyTrack, index: number) => ({
      spotifyId: track.id,
      name: track.name,
      artistName: track.artists[0].name,
      albumName: track.album.name,
      imageUrl: track.album.images[0]?.url,
      popularity: track.popularity,
      timeRange: prismaRange,
      rank: index + 1,
    })), prismaRange);
  }
}