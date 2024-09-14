import "next-auth";
import { JWT as NextAuthJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    id?: string;
    image?: string;
    tokenExpires?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends NextAuthJWT {
    accessToken?: string;
    refreshToken?: string;
    id?: string;
    image?: string;
    tokenExpires?: number;
  }
}