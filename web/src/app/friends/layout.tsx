import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Friends",
    description: "Manage your VibeChat connections. Send requests, accept vibes, and grow your social circle.",
};

export default function FriendsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
