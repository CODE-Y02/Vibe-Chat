import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

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
                isAnonymous: { label: "Anonymous", type: "boolean" },
            },
            async authorize(credentials) {
                if (!credentials) return null;

                const baseUrl = process.env.NEXT_PUBLIC_API_URL;
                let endpoint = `${baseUrl}/api/auth/login`;
                let body = JSON.stringify({
                    username: credentials.username,
                    email: credentials.email,
                    password: credentials.password,
                });

                if (credentials.isAnonymous === "true") {
                    endpoint = `${baseUrl}/api/auth/anonymous`;
                    body = JSON.stringify({});
                }

                try {
                    const res = await fetch(endpoint, {
                        method: "POST",
                        body,
                        headers: { "Content-Type": "application/json" },
                    });

                    const user = await res.json();

                    if (res.ok && user) {
                        return {
                            id: user.id || user.userId,
                            name: user.username,
                            email: user.email,
                            image: user.avatar,
                            accessToken: user.accessToken,
                            refreshToken: user.refreshToken,
                        };
                    }
                    return null;
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                token.accessToken = user.accessToken;
                token.refreshToken = user.refreshToken;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.accessToken = token.accessToken as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
});
