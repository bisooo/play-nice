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

  public async getRecommendations(genre:string, tempo:string, energy:string, acousticness:string, danceability:string, instrumentalness:string, liveness:string, speechiness:string, popularity:string) {
    return this.get(`recommendations?seed_genres=${genre}&target_tempo=${tempo}&target_energy=${energy}&target_acousticness=${acousticness}&target_danceability=${danceability}&target_instrumentalness=${instrumentalness}&target_liveness=${liveness}&target_speechiness=${speechiness}&target_popularity=${popularity}`);
  }
}