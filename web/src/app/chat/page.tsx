"use client";

import { useChatStore } from '@/store/useChatStore';
import { useSession } from "@/components/layout/SessionProvider";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { StrangerVideoChat } from '@/components/chat/StrangerVideoChat';
import { FriendVideoChat } from '@/components/chat/FriendVideoChat';

export default function ChatPage() {
    const { status } = useSession();
    const router = useRouter();
    const isDirectCall = useChatStore(state => state.session.isDirectCall);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    if (status === 'loading') return null;

    return isDirectCall ? <FriendVideoChat /> : <StrangerVideoChat />;
}
