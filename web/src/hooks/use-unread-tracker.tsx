"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSocket } from "@/hooks/use-socket";
import { useFeedStore } from "@/store/useFeedStore";
import { useFriendStore } from "@/store/useFriendStore";
import { useDMStore } from "@/store/useDMStore";
import { getUnreadCount } from "@/actions/dm.actions";
import { useSession } from "@/components/layout/SessionProvider";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Global hook to manage real-time notification badges.
 * Hydrates state once on mount and listens to WebSocket events.
 */
export function useUnreadTracker(toast?: any) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { socket } = useSocket();

    const { setHasNewPosts } = useFeedStore();
    const { setHasNewRequests } = useFriendStore();
    const { setTotalUnreadCount, incrementUnread } = useDMStore();

    // 1. Initial Hydration
    useEffect(() => {
        if (!session?.user) return;
        getUnreadCount().then(data => {
            setTotalUnreadCount(data?.totalUnreadChats || 0);
        });
    }, [session?.user, setTotalUnreadCount]);

    // 2. Clear state when visiting relevant pages
    useEffect(() => {
        if (pathname === "/feed") setHasNewPosts(false);
        if (pathname === "/friends") setHasNewRequests(false);
    }, [pathname, setHasNewPosts, setHasNewRequests]);

    // 3. Real-time Listeners
    useEffect(() => {
        if (!socket) return;

        const onFriendRequest = () => {
            setHasNewRequests(true);
            if (toast) {
                toast({
                    title: "New Friend Request!",
                    description: "Someone wants to vibe with you.",
                    action: (
                        <Link href="/friends">
                            <Button size="sm" className="bg-primary text-white font-bold h-8 rounded-lg px-4 text-[10px] uppercase tracking-widest">
                                View
                            </Button>
                        </Link>
                    )
                });
            }
        };

        const onFriendAccepted = () => {
            if (toast) {
                toast({
                    title: "Vibe Connected!",
                    description: "Your friend request was accepted.",
                    className: "bg-vibe-gradient text-white border-none shadow-glow",
                });
            }
        };

        const onNewPost = () => setHasNewPosts(true);

        const onDM = () => {
            // Only increment global badge if we are NOT on the DMs page.
            if (pathname !== "/dms") {
                incrementUnread();
            }
        };

        socket.on('friend_request', onFriendRequest);
        socket.on('friend_accepted', onFriendAccepted);
        socket.on('new_post', onNewPost);
        socket.on('dm', onDM);

        return () => {
            socket.off('friend_request', onFriendRequest);
            socket.off('friend_accepted', onFriendAccepted);
            socket.off('new_post', onNewPost);
            socket.off('dm', onDM);
        };
    }, [socket, pathname, setHasNewRequests, setHasNewPosts, incrementUnread, toast]);
}
