import type { Metadata } from "next";
import siteConfig from "@/config/site.json";

export const metadata: Metadata = {
    title: "Sign In",
    description: "Sign in to VibeChat with a magic link or Google. Start anonymous video chat, connect with friends, and join the vibe.",
    alternates: { canonical: `${siteConfig.url}/login` },
    openGraph: {
        title: "Sign In | VibeChat",
        description: "Sign in to VibeChat. Instant anonymous video chat, P2P encrypted, AI moderated.",
        url: `${siteConfig.url}/login`,
    },
    twitter: {
        card: "summary",
        title: "Sign In | VibeChat",
        description: "Sign in to VibeChat. Instant anonymous video chat.",
    },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
