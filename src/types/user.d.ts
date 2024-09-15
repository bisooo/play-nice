import { TimeRange } from '@prisma/client';

export interface UserData {
  spotifyId: string;
  email: string;
  name?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface TopArtistData {
  spotifyId: string;
  name: string;
  imageUrl?: string;
  popularity?: number;
  genres: string[];
  timeRange: TimeRange;
  rank: number;
}

export interface TopTrackData {
  spotifyId: string;
  name: string;
  artistName: string;
  albumName?: string;
  imageUrl?: string;
  popularity?: number;
  timeRange: TimeRange;
  rank: number;
}

export interface UserInsights {
  topArtists: TopArtistData[];
  topTracks: TopTrackData[];
}