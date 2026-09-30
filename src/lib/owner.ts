import { refreshAccessToken } from '@/lib/spotifyTokenManager';
import { SpotifyService } from '@/lib/spotifyService';
import userManager from '@/lib/userManager';

// There is no login: the app shows one person's listening, the Spotify account that
// SPOTIFY_REFRESH_TOKEN belongs to (get one with scripts/spotify-refresh-token.mjs).
// Its access token lives in the owner's User row so every server instance shares it.

// Refresh a minute before expiry so in-flight requests don't hit a dead token
const EXPIRY_MARGIN_MS = 60 * 1000;

export class OwnerNotConfiguredError extends Error {
  constructor() {
    super('SPOTIFY_REFRESH_TOKEN is not set');
  }
}

function ownerRefreshToken() {
  const token = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!token) throw new OwnerNotConfiguredError();
  return token;
}

// The owner's User row, or null before the first Spotify call has created it
export async function getOwnerUser() {
  return userManager.getUserByRefreshToken(ownerRefreshToken());
}

// The owner's User row plus a SpotifyService with a live access token
export async function getOwner() {
  const refreshToken = ownerRefreshToken();
  const user = await userManager.getUserByRefreshToken(refreshToken);
  if (user?.accessToken && user.accessTokenExpires && user.accessTokenExpires.getTime() - EXPIRY_MARGIN_MS > Date.now()) {
    return { user, spotify: new SpotifyService(user.accessToken) };
  }

  const refreshed = await refreshAccessToken(refreshToken);
  if (refreshed.refreshToken !== refreshToken) {
    // Not seen so far (2026-09-30). The row stays keyed by the env token; if Spotify retires
    // the old one, update SPOTIFY_REFRESH_TOKEN to the new value from the log.
    console.warn('[owner] Spotify rotated the refresh token; SPOTIFY_REFRESH_TOKEN may stop working');
  }
  const spotify = new SpotifyService(refreshed.accessToken);
  const profile = user ? null : await spotify.getMe();

  const saved = await userManager.upsertUser({
    spotifyId: user?.spotifyId ?? profile.id,
    name: profile?.display_name ?? undefined,
    accessToken: refreshed.accessToken,
    accessTokenExpires: new Date(refreshed.tokenExpiresAt),
    refreshToken,
  });
  return { user: saved, spotify };
}
