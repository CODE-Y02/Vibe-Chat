import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Vibe Feed",
    description: "See what your friends are up to. Share your vibe with the VibeChat community.",
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
