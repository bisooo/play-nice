import { Profile } from "next-auth";

export interface SpotifyProfile extends Profile {
  id: string;
  display_name: string | null;
  email: string;
  images: { url: string; height: number | null; width: number | null }[];
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