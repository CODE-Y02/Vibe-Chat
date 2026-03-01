import NextAuth, { type DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        accessToken?: string;
        error?: "RefreshTokenExpired";
        user: {
            id: string;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        accessToken?: string;
        refreshToken?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string;
        refreshToken?: string;
        accessTokenExpires?: number; // Unix ms timestamp
        id: string;
        error?: "RefreshTokenExpired";
    }
}
