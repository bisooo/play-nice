import { Profile } from "next-auth";

export interface SpotifyProfile extends Profile {
  id: string;
  display_name: string | null;
  email: string;
  images: { url: string; height: number | null; width: number | null }[];
}

export interface FetchParams {
  genre: string;
  tempo: number;
  energy: number;
  acousticness: number;
  danceability: number;
  instrumentalness: number;
  liveness: number;
  speechiness: number;
  popularity: number;
}

export interface TrackParams {
  seed_genres: string;
  target_tempo: string;
  target_energy: string;
  target_acousticness: string;
  target_danceability: string;
  target_instrumentalness: string;
  target_liveness: string;
  target_speechiness: string;
  target_popularity: string;
  market: string;
  limit: string;
  offset: string;
}

export interface AudioFeatures {
  key: number;
  mode: number;
  tempo: number;
}

export interface SpotifyImage {
  url: string;
  width: number;
  height: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
  popularity: number;
  genres: string[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  preview_url: string | null;
  artists: Array<{
    name: string;
  }>;
  album: {
    name: string;
    images: SpotifyImage[];
  };
  popularity: number;
}

export interface SpotifyRecommendationsResponse {
  tracks: SpotifyTrack[];
}

export interface SpotifyTopArtistsResponse {
  items: SpotifyArtist[];
  total: number;
  limit: number;
  offset: number;
  href: string;
  next: string | null;
  previous: string | null;
}

export interface SpotifyTopTracksResponse {
  items: SpotifyTrack[];
  total: number;
  limit: number;
  offset: number;
  href: string;
  next: string | null;
  previous: string | null;
}