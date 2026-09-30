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
    name: string;
  }>;
  album: {
    name: string;
    images: SpotifyImage[];
  };
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
