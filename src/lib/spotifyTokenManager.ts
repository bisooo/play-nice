import axios from 'axios';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;

export async function refreshAccessToken(refreshToken: string) {
  try {
    const response = await axios.post(
      SPOTIFY_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
        },
      }
    );

    // Spotify returns expires_in (seconds) and may rotate the refresh token
    const accessToken: string = response.data.access_token;
    const tokenExpiresAt = Date.now() + response.data.expires_in * 1000;
    const newRefreshToken: string = response.data.refresh_token ?? refreshToken;

    return { accessToken, tokenExpiresAt, refreshToken: newRefreshToken };
  } catch (error) {
    console.error('FAILED TO REFRESH ACCESS TOKEN', error);
    throw new Error('TOKEN REFRESH FAILED');
  }
}
