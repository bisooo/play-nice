import { NextAuthOptions, Session, JWT, DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import SpotifyProvider from "next-auth/providers/spotify";
import { refreshAccessToken } from "@/lib/spotifyTokenManager";
import userManager from "@/lib/userManager";

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string;
    refreshToken?: string;
    id?: string;
    image?: string;
    tokenExpires?: number;
  }

  interface JWT extends DefaultJWT {
    accessToken?: string;
    refreshToken?: string;
    id?: string;
    image?: string;
    tokenExpires?: number;
  }
}

const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-read-private",
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-modify-playback-state",
  "streaming",
  "user-library-read",
  "user-library-modify",
  "playlist-read-private",
  "playlist-modify-private",
  "playlist-modify-public"
].join(",");

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
    async jwt({ token, account, profile }: { token: JWT; account?: any; profile?: any }) {
      if (account && profile) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.id = profile.id;
        token.image = profile.images?.[0]?.url;
        token.tokenExpires = account.expires_at * 1000; // Convert to milliseconds

        await userManager.upsertUser({
          spotifyId: profile.id,
          email: profile.email,
          name: profile.display_name,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
        });
      }

      // Check if the token needs to be refreshed
      if (token.tokenExpires && Date.now() >= token.tokenExpires) {
        try {
          const { accessToken, tokenExpiresAt } = await refreshAccessToken(token.refreshToken as string, token.id as string);
          token.accessToken = accessToken;
          token.tokenExpires = tokenExpiresAt;
          
          // Update the user's tokens in the database
          await userManager.updateUserTokens(token.id as string, accessToken, token.refreshToken as string);
        } catch (error) {
          console.error('Error refreshing access token:', error);
          // If refresh fails, clear the token to force re-authentication
          return { ...token, error: "RefreshAccessTokenError" };
        }
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.id = token.id;
      session.image = token.image;
      session.tokenExpires = token.tokenExpires;

      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
};