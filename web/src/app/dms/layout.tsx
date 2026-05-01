import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Messages",
    description: "Your private DMs on VibeChat. Chat with friends you've vibed with.",
};

export default function DMsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
