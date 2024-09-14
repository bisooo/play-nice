export interface SpotifyTrack {
  id: string;
  name: string;
  preview_url: string | null;
  artists: Array<{
    name: string;
  }>;
  album: {
    name: string;
    images: Array<{ url: string; width: number; height: number }>;
  };
}

export interface SpotifyRecommendationsResponse {
  tracks: SpotifyTrack[];
}