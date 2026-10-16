export interface SpotifyProfile {
  id: string;
  display_name: string | null;
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
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: SpotifyImage[];
  };
  duration_ms: number;
  popularity: number;
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
// GET /me/player/recently-played: the last 50 plays at most, newest first.
// Local files come back with a null track id.
export interface SpotifyRecentlyPlayedResponse {
  items: Array<{
    track: SpotifyTrack;
    played_at: string;
    context: { type: string; uri: string } | null;
  }>;
}

// Trimmed GET /me/player/currently-playing, as served by /api/spotify/current-track
export interface NowPlaying {
  isPlaying: boolean;
  progressMs: number;
  track: {
    id: string;
    name: string;
    artists: string[];
    album: string;
    imageUrl: string | null;
    durationMs: number;
  } | null;
}
