import { NextAuthOptions, Session, JWT, DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt"; 
import SpotifyProvider from "next-auth/providers/spotify";
import { refreshAccessToken } from "@lib/spotifyTokenManager";
import userManager from "@lib/userManager";

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string;
    refreshToken?: string;
    id?: string;
    image?: string;  
  }

  interface JWT extends DefaultJWT {
    accessToken?: string;
    refreshToken?: string;
    id?: string;
    image?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: "https://accounts.spotify.com/authorize?scope=user-read-email,user-read-private,user-read-currently-playing",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET!,
  pages: {
    signOut: '/', // Redirect to the homepage after sign out
  },
  callbacks: {
    async jwt({ token, account, profile }: { token: JWT; account?: any; profile?: any }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        // Store additional user profile details from Spotify in the token
        if (profile) {
          token.id = profile.id;
          token.image = profile.images?.[0]?.url;
        }

        // Create or update user in the database upon login
        await userManager.upsertUser({
          spotifyId: profile?.id,
          email: profile?.email,
          name: profile?.name,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
        });

        // Check token validity
        if (Date.now() >= (account.expires_at * 1000) && token.refreshToken) { // Convert seconds to milliseconds
          try {
            const { accessToken, tokenExpiresAt } = await refreshAccessToken(token.refreshToken, profile?.id);
            token.accessToken = accessToken;
            token.tokenExpires = tokenExpiresAt; // Ensure tokenExpires is properly set
          } catch (error) {
            console.error('Error refreshing access token:', error);
          }
        }
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      session.id = token.id;
      session.image = token.image;
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      return session;
    },
  },
};
