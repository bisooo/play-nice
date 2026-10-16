import { PlayData, SnapshotArtistData, SnapshotTrackData, TopArtistData, TopTrackData, UserData } from '@/types/user';
import { prisma } from './prisma';
import { Prisma, TimeRange } from '@prisma/client';

class UserManager {
  async upsertUser(userData: UserData) {
    try {
      const { spotifyId, ...data } = userData;
      return await prisma.user.upsert({
        where: { spotifyId: spotifyId },
        update: data,
        create: { 
          spotifyId: userData.spotifyId, 
          email: userData.email,
          name: userData.name,
          accessToken: userData.accessToken,
          refreshToken: userData.refreshToken,
          accessTokenExpires: userData.accessTokenExpires,
        },
      });
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  async getUserById(spotifyId: string) {
    try {
      return await prisma.user.findUnique({
        where: { spotifyId: spotifyId },
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // The owner is the account SPOTIFY_REFRESH_TOKEN belongs to (see src/lib/owner.ts)
  async getUserByRefreshToken(refreshToken: string) {
    return prisma.user.findFirst({ where: { refreshToken } });
  }

  // Replaces the current list and appends it to history in one transaction
  async updateTopArtists(userId: string, artists: TopArtistData[], snapshot: SnapshotArtistData[], timeRange: TimeRange, capturedAt: Date) {
    try {
      await prisma.$transaction(async (prisma) => {
        // Delete existing top artists for this user and time range
        await prisma.topArtist.deleteMany({
          where: { userId, timeRange },
        });

        // Insert new top artists
        await prisma.topArtist.createMany({
          data: artists.map(artist => ({
            ...artist,
            userId,
          })),
        });

        await prisma.topArtistSnapshot.create({
          data: { userId, timeRange, capturedAt, items: snapshot },
        });
      });
    } catch (error) {
      console.error('Error updating top artists:', error);
      throw error;
    }
  }

  async updateTopTracks(userId: string, tracks: TopTrackData[], snapshot: SnapshotTrackData[], timeRange: TimeRange, capturedAt: Date) {
    try {
      await prisma.$transaction(async (prisma) => {
        // Delete existing top tracks for this user and time range
        await prisma.topTrack.deleteMany({
          where: { userId, timeRange },
        });

        // Insert new top tracks
        await prisma.topTrack.createMany({
          data: tracks.map(track => ({
            ...track,
            userId,
          })),
        });

        await prisma.topTrackSnapshot.create({
          data: { userId, timeRange, capturedAt, items: snapshot },
        });
      });
    } catch (error) {
      console.error('Error updating top tracks:', error);
      throw error;
    }
  }

  // Atomically marks the user as synced if their data is older than staleBefore.
  // Returns the claimed user, or null if data is fresh or another request claimed it first.
  async claimTopItemsSync(spotifyId: string, staleBefore: Date, now: Date) {
    const { count } = await prisma.user.updateMany({
      where: {
        spotifyId,
        OR: [
          { lastTopItemsUpdate: { isSet: false } },
          { lastTopItemsUpdate: null },
          { lastTopItemsUpdate: { lt: staleBefore } },
        ],
      },
      data: { lastTopItemsUpdate: now },
    });
    return count === 1 ? this.getUserById(spotifyId) : null;
  }

  async updateLastTopItemsUpdate(userId: string, updateTime: Date | null) {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: { lastTopItemsUpdate: updateTime },
      });
    } catch (error) {
      console.error('Error updating last top items update time:', error);
      throw error;
    }
  }

  // playedAt values of these plays that are already stored
  async getStoredPlayTimes(userId: string, playedAt: Date[]) {
    const stored = await prisma.play.findMany({
      where: { userId, playedAt: { in: playedAt } },
      select: { playedAt: true },
    });
    return new Set(stored.map(play => play.playedAt.getTime()));
  }

  // One batch insert (a Vercel Hobby function gets 10s; 50 upserts took ~14s). If a concurrent
  // poll inserted some first, the unique (userId, playedAt) rejects the batch and we fall back
  // to upserts, which skip what's already there.
  async addPlays(userId: string, plays: PlayData[]) {
    if (plays.length === 0) return;
    try {
      await prisma.play.createMany({ data: plays.map(play => ({ ...play, userId })) });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) throw error;
      for (const play of plays) {
        await prisma.play.upsert({
          where: { userId_playedAt: { userId, playedAt: play.playedAt } },
          update: {},
          create: { ...play, userId },
        });
      }
    }
  }

  async getTopArtists(spotifyId: string, timeRange: TimeRange) {
    if (!spotifyId) {
      throw new Error('Spotify ID is required');
    }
    try {
      const user = await prisma.user.findUnique({
        where: { spotifyId },
      });
      if (!user) {
        throw new Error('User not found');
      }
      return await prisma.topArtist.findMany({
        where: { userId: user.id, timeRange },
        orderBy: { rank: 'asc' },
      });
    } catch (error) {
      console.error('Error fetching top artists:', error);
      throw error;
    }
  }

  async getTopTracks(spotifyId: string, timeRange: TimeRange) {
    if (!spotifyId) {
      throw new Error('Spotify ID is required');
    }
    try {
      const user = await prisma.user.findUnique({
        where: { spotifyId },
      });
      if (!user) {
        throw new Error('User not found');
      }
      return await prisma.topTrack.findMany({
        where: { userId: user.id, timeRange },
        orderBy: { rank: 'asc' },
      });
    } catch (error) {
      console.error('Error fetching top tracks:', error);
      throw error;
    }
  }
}

export default new UserManager();