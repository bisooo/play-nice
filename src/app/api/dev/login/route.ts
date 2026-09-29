import { NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { Session } from 'next-auth';
import { refreshAccessToken } from '@/lib/spotifyTokenManager';
import { SpotifyService } from '@/lib/spotifyService';
import userManager from '@/lib/userManager';

// Dev-only login for cloud sessions, where the Spotify login page can't be used.
// Mints a normal NextAuth session from DEV_SPOTIFY_REFRESH_TOKEN (get one with
// scripts/spotify-refresh-token.mjs). Every guard must pass or the route is a 404.

// Env guards must be read per request, not baked in at build time
export const dynamic = 'force-dynamic';

const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // NextAuth's default, in seconds

function isLoopback(url: string | undefined) {
  try {
    return ['127.0.0.1', 'localhost'].includes(new URL(url!).hostname);
  } catch {
    return false;
  }
}

function devLoginEnabled() {
  return (
    !!process.env.DEV_SPOTIFY_REFRESH_TOKEN &&
    !process.env.VERCEL &&
    isLoopback(process.env.NEXTAUTH_URL) &&
    // Hard rule 6: never write to a real database
    isLoopback(process.env.DATABASE_URL)
  );
}

export async function GET() {
  if (!devLoginEnabled()) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const { accessToken, tokenExpiresAt, refreshToken } =
      await refreshAccessToken(process.env.DEV_SPOTIFY_REFRESH_TOKEN!);
    if (refreshToken !== process.env.DEV_SPOTIFY_REFRESH_TOKEN) {
      console.warn('[dev-login] Spotify rotated the refresh token; DEV_SPOTIFY_REFRESH_TOKEN may stop working');
    }

    const profile = await new SpotifyService({ accessToken } as Session).getMe();

    await userManager.upsertUser({
      spotifyId: profile.id,
      name: profile.display_name ?? undefined,
      accessToken,
      refreshToken,
    });

    // Same shape the jwt callback in authOptions builds on a real login
    const sessionToken = await encode({
      token: {
        sub: profile.id,
        name: profile.display_name,
        picture: profile.images?.[0]?.url,
        accessToken,
        refreshToken,
        id: profile.id,
        image: profile.images?.[0]?.url,
        tokenExpires: tokenExpiresAt,
      },
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge: SESSION_MAX_AGE,
    });

    const response = NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL));
    // NEXTAUTH_URL is http on loopback, so NextAuth uses the unprefixed cookie name
    response.cookies.set('next-auth.session-token', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    console.error('[dev-login] failed:', error);
    return NextResponse.json({ error: 'Dev login failed; check the server log' }, { status: 500 });
  }
}
