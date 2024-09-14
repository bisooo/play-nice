import { TopArtistData, TopTrackData, UserData } from '@/types/user';
import { prisma } from './prisma';
import { TimeRange } from '@prisma/client';

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

  async updateUserTokens(spotifyId: string, accessToken: string, refreshToken: string) {
    try {
      return await prisma.user.update({
        where: { spotifyId: spotifyId },
        data: { 
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
      });
    } catch (error) {
      console.error('Error updating user tokens:', error);
      throw error;
    }
  }

  async updateTopArtists(userId: string, artists: TopArtistData[], timeRange: TimeRange) {
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
      });
    } catch (error) {
      console.error('Error updating top artists:', error);
      throw error;
    }
  }

  async updateTopTracks(userId: string, tracks: TopTrackData[], timeRange: TimeRange) {
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
      });
    } catch (error) {
      console.error('Error updating top tracks:', error);
      throw error;
    }
  }

  async updateLastTopItemsUpdate(userId: string, updateTime: Date) {
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

  async getTopArtists(userId: string, timeRange: TimeRange) {
    try {
      return await prisma.topArtist.findMany({
        where: { userId, timeRange },
        orderBy: { rank: 'asc' },
      });
    } catch (error) {
      console.error('Error fetching top artists:', error);
      throw error;
    }
  }

  async getTopTracks(userId: string, timeRange: TimeRange) {
    try {
      return await prisma.topTrack.findMany({
        where: { userId, timeRange },
        orderBy: { rank: 'asc' },
      });
    } catch (error) {
      console.error('Error fetching top tracks:', error);
      throw error;
    }
  }
}

export default new UserManager();