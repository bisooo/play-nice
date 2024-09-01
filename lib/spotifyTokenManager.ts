import axios from 'axios';
import { prisma } from './prisma';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;

export async function refreshAccessToken(refreshToken: string, id: string) {
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

    const accessToken = response.data.access_token;
    const tokenExpiresAt = response.data.expires_at;

    // Update token in the database
    await prisma.user.update({
      where: { spotifyId: id },
      data: {
        accessToken: accessToken,
      },
    });

    return { accessToken, tokenExpiresAt };
  } catch (error) {
    console.error('FAILED TO REFRESH ACCESS TOKEN', error);
    throw new Error('TOKEN REFRESH FAILED');
  }
}
