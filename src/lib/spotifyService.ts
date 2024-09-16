import { TrackParams } from '@/types/spotifyTypes';
import axios from 'axios';
import { Session } from 'next-auth';

export class SpotifyService {
  private accessToken: string;

  constructor(session: Session) {
    this.accessToken = session.accessToken!;
  }

  private async get(endpoint: string, params?: Record<string, string>) {
    try {
      const url = new URL(`https://api.spotify.com/v1/${endpoint}`);
      if (params) {
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
      }
      const fullUrl = url.toString();

      console.log(`Sending request to Spotify API: ${fullUrl}`);
      const response = await axios.get(fullUrl, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Spotify API Error: ${error.response?.status} ${error.response?.statusText}`);
      } else {
        console.error(`Unexpected error:`, error);
        throw error;
      }
    }
  }

  public async getCurrentTrack() {
    return this.get('me/player/currently-playing');
  }

  public async getRecommendations(trackParams: TrackParams) {
    const params = Object.entries(trackParams).reduce((acc, [key, value]) => {
      acc[key] = value.toString();
      return acc;
    }, {} as Record<string, string>);
  
    return this.get('recommendations', params);
  }

  public async getTopArtists(timeRange: 'short_term' | 'medium_term' | 'long_term', limit: number = 50) {
    return this.get('me/top/artists', { time_range: timeRange, limit: limit.toString() });
  }

  public async getTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term', limit: number = 50) {
    return this.get('me/top/tracks', { time_range: timeRange, limit: limit.toString() });
  }

  public async searchTrack(track: string, artist: string) {
    const searchParams = {
      q: `track:${track} artist:${artist}`,
      type: 'track',
      limit: '1'
    };
    return this.get('search', searchParams);
  }

  public async getAudioFeatures(trackId: string) {
    return this.get(`audio-features/${encodeURIComponent(trackId)}`);
  }
}