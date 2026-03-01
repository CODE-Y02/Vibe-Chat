import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";

// Access token lives 15 minutes (matches backend). We refresh 60s before expiry.
const ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1000;
const REFRESH_SKEW_MS = 60 * 1000; // refresh 1 min before expiry

async function refreshAccessToken(token: JWT): Promise<JWT> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: token.refreshToken }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error ?? "Refresh failed");

        return {
            ...token,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken ?? token.refreshToken, // rotate if provided
            accessTokenExpires: Date.now() + ACCESS_TOKEN_LIFETIME_MS,
            error: undefined,
        };
    } catch (err) {
        console.error("[refreshAccessToken] Failed:", err);
        // Mark the token as expired — SessionProvider / middleware can react to this
        return { ...token, error: "RefreshTokenExpired" };
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.password) return null;

                const baseUrl = process.env.NEXT_PUBLIC_API_URL;
                const endpoint = `${baseUrl}/auth/login`;

                try {
                    const res = await fetch(endpoint, {
                        method: "POST",
                        body: JSON.stringify({
                            username: credentials.username || undefined,
                            email: credentials.email || undefined,
                            password: credentials.password,
                        }),
                        headers: { "Content-Type": "application/json" },
                    });

                    // Backend returns: { user: {...}, accessToken: string, refreshToken: string }
                    const data = await res.json();

                    if (!res.ok) {
                        console.error(`[authorize] Backend rejected: ${res.status}`, data);
                        return null;
                    }

                    const { user, accessToken, refreshToken } = data;

                    return {
                        id: user.id,
                        name: user.username,
                        email: user.email,
                        image: user.avatar,
                        accessToken,
                        refreshToken,
                    };
                } catch (error) {
                    console.error(`[authorize] Could not reach backend at ${endpoint}:`, error);
                    return null;
                }
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }) {
            // Initial sign-in: populate token from the user object
            if (user) {
                return {
                    ...token,
                    id: user.id,
                    accessToken: user.accessToken,
                    refreshToken: user.refreshToken,
                    // Set expiry slightly shorter than actual to give refresh skew room
                    accessTokenExpires: Date.now() + ACCESS_TOKEN_LIFETIME_MS,
                };
            }

            // Token still valid — return as-is
            if (Date.now() < (token.accessTokenExpires ?? 0) - REFRESH_SKEW_MS) {
                return token;
            }

            // Access token has expired — attempt refresh
            console.log("[jwt] Access token expired, refreshing...");
            return refreshAccessToken(token);
        },

        async session({ session, token }) {
            session.user.id = token.id;
            session.accessToken = token.accessToken;
            session.error = token.error;
            return session;
        },
    },

    pages: {
        signIn: "/login",
    },
});
