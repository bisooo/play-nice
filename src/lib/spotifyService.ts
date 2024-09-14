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
      const response = await axios.get(`https://api.spotify.com/v1/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        params,
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching from Spotify API: ${error}`);
      throw new Error(`Spotify API Error: ${error}`);
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
}