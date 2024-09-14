import { NextAuthOptions } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import { refreshAccessToken } from "@/lib/spotifyTokenManager";
import userManager from "@/lib/userManager";
import { SpotifyProfile } from "@/types/spotify";

const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-read-currently-playing",
  "streaming",
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
  pages: {
    signIn: '/login',
    signOut: '/',
  },
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
          email: profile.email!,
          name: spotifyProfile.display_name!,
          accessToken: account.access_token!,
          refreshToken: account.refresh_token!,
        });
      }

      // Check if the token needs to be refreshed
      if (token.tokenExpires && Date.now() >= token.tokenExpires) {
        try {
          const { accessToken, tokenExpiresAt } = await refreshAccessToken(token.refreshToken!, token.id!);
          token.accessToken = accessToken;
          token.tokenExpires = tokenExpiresAt;
          
          // Update the user's tokens in the database
          await userManager.updateUserTokens(token.id!, accessToken, token.refreshToken!);
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
      session.refreshToken = token.refreshToken;
      session.id = token.id!;
      session.image = token.image;
      session.tokenExpires = token.tokenExpires;

      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
};