import { TimeRange } from '@prisma/client';

export interface UserData {
  spotifyId: string;
  email?: string | null;
  name?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: Date;
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

export interface SnapshotArtistData {
  spotifyId: string;
  name: string;
  imageUrl?: string;
  genres: string[];
  rank: number;
}

export interface PlayArtistData {
  spotifyId: string;
  name: string;
}

export interface SnapshotTrackData {
  spotifyId: string;
  name: string;
  artists: PlayArtistData[];
  albumName?: string;
  imageUrl?: string;
  rank: number;
}

export interface UserInsights {
  topArtists: TopArtistData[];
  topTracks: TopTrackData[];
}