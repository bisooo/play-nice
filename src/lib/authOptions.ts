import { NextAuthOptions } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import { refreshAccessToken } from "@/lib/spotifyTokenManager";
import userManager from "@/lib/userManager";
import { SpotifyProfile } from "@/types/spotify";

const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-read-currently-playing",
  "user-library-read",
  "user-top-read"
].join(" ");

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: `https://accounts.spotify.com/authorize?scope=${encodeURIComponent(SPOTIFY_SCOPES)}`,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET!,
  // Failed or cancelled logins land on the home page (Login shows a message) instead of NextAuth's error page
  pages: { error: "/" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const spotifyProfile = profile as SpotifyProfile;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.id = spotifyProfile.id;
        token.image = spotifyProfile.images?.[0]?.url;
        token.tokenExpires = account.expires_at ? account.expires_at * 1000 : undefined; // Convert to milliseconds

        await userManager.upsertUser({
          spotifyId: spotifyProfile.id,
          // Spotify no longer returns email to Development Mode apps
          email: profile.email ?? null,
          name: spotifyProfile.display_name!,
          accessToken: account.access_token!,
          refreshToken: account.refresh_token!,
        });
      }

      // Refresh a minute before expiry so in-flight requests don't hit a dead token
      if (token.tokenExpires && Date.now() >= token.tokenExpires - 60 * 1000) {
        try {
          const { accessToken, tokenExpiresAt, refreshToken } = await refreshAccessToken(token.refreshToken!);
          token.accessToken = accessToken;
          token.tokenExpires = tokenExpiresAt;
          token.refreshToken = refreshToken;
          delete token.error;

          await userManager.updateUserTokens(token.id!, accessToken, refreshToken);
        } catch (error) {
          console.error('Error refreshing access token:', error);
          // If refresh fails, clear the token to force re-authentication
          return { ...token, error: "RefreshAccessTokenError" };
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.id = token.id!;
      session.image = token.image;
      session.tokenExpires = token.tokenExpires;
      session.error = token.error;

      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
};