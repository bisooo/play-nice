import axios from 'axios';
import { Session } from 'next-auth';

export class SpotifyService {
  private accessToken: string;

  constructor(session: Session) {
    this.accessToken = session.accessToken!;
  }

  private async get(endpoint: string) {
    try {
      const response = await axios.get(`https://api.spotify.com/v1/${endpoint}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
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

  public async getTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term') {
    return this.get(`me/top/tracks?time_range=${timeRange}`);
  }

  public async getPlaylists() {
    return this.get('me/playlists');
  }
}
