"use client";

import { useEffect, useState, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar, Conversation } from '@/components/layout/Sidebar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConversations, getMessages, sendMessage, markAsRead } from '@/actions/dm.actions';
import { getFriends } from '@/actions/friend.actions';
import { Loader2, MessageSquare, Send, Video, Sparkles, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSocket } from '@/hooks/use-socket';
import { useSession } from "@/components/layout/SessionProvider";
import { useChatStore } from '@/store/useChatStore';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function DMsPage() {
    const { data: session, status } = useSession();
    const queryClient = useQueryClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const userIdFromQuery = searchParams.get('userId');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);
    const { socket } = useSocket();
    const [activePeer, setActivePeer] = useState<Conversation | null>(null);
    const [input, setInput] = useState("");
    const { setMatched } = useChatStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleCall = () => {
        if (!activePeer || !session?.user) return;
        setMatched("direct-room", activePeer.peer.id, activePeer.peer.username, activePeer.peer.avatar);
        router.push("/chat");
    };

    const { data: convData, isLoading: isLoadingConvs, isError: isConvsError } = useQuery({
        queryKey: ['conversations'],
        queryFn: () => getConversations(),
        retry: 1,
        staleTime: 30_000,
        refetchOnWindowFocus: true,
    });

    const { data: friendsData } = useQuery({
        queryKey: ['friends'],
        queryFn: getFriends,
        enabled: !!userIdFromQuery,
    });

    // Auto-select peer if userId is in query params
    // Works even if no prior conversation exists (new friend)
    useEffect(() => {
        if (!userIdFromQuery) return;

        // 1. Try to find an existing conversation
        if (convData?.conversations) {
            const existing = convData.conversations.find((c: Conversation) => c.peer.id === userIdFromQuery);
            if (existing) {
                setActivePeer(existing);
                return;
            }
        }

        // 2. No conversation yet — create a synthetic peer from friends list
        if (friendsData) {
            const friend = friendsData.find((f: any) => f.id === userIdFromQuery);
            if (friend) {
                setActivePeer({
                    peer: {
                        id: friend.id,
                        username: friend.username || 'Vibe Buddy',
                        avatar: friend.avatar,
                    },
                    lastMessage: '',
                    createdAt: new Date().toISOString(),
                    isUnread: false,
                });
            }
        }
    }, [userIdFromQuery, convData, friendsData]);

    const { data: messages, isLoading: isLoadingMessages } = useQuery({
        queryKey: ['messages', activePeer?.peer.id],
        queryFn: () => activePeer ? getMessages(activePeer.peer.id) : Promise.resolve([]),
        enabled: !!activePeer,
        retry: false,
        staleTime: 10_000,
    });

    const sendMutation = useMutation({
        mutationFn: ({ to, content }: { to: string, content: string }) => sendMessage(to, content),
        onMutate: async ({ to, content }) => {
            // Cancel in-flight refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: ['messages', to] });

            const tempMsg = {
                id: `opt-${Date.now()}`,
                senderId: 'me-optimistic', // != peer id → isMe = true
                receiverId: to,
                content,
                isRead: false,
                createdAt: new Date().toISOString(),
            };
            queryClient.setQueryData(
                ['messages', to],
                (old: any[] = []) => [...old, tempMsg]
            );
            return { to };
        },
        onSuccess: (_data, { to }) => {
            setInput("");
            // Refetch with real data from DB (clears the opt- temp message)
            queryClient.invalidateQueries({ queryKey: ['messages', to] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
        onError: (_err, { to }) => {
            queryClient.invalidateQueries({ queryKey: ['messages', to] });
        },
    });

    // ── Real-time incoming DM listener ──────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        const handleIncoming = (msg: {
            id: string; senderId: string; receiverId: string;
            content: string; createdAt: string; isRead: boolean;
        }) => {
            // Always refresh conversations sidebar
            queryClient.invalidateQueries({ queryKey: ['conversations'] });

            // Append to open chat if it matches sender
            if (activePeer?.peer.id === msg.senderId) {
                queryClient.setQueryData(
                    ['messages', msg.senderId],
                    (old: any[] = []) => [...old, msg]
                );
            }
        };

        socket.on('dm', handleIncoming);
        return () => { socket.off('dm', handleIncoming); };
    }, [socket, activePeer?.peer.id, queryClient]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle mobile hardware back button to close chat instead of leaving page
    useEffect(() => {
        const handlePopState = () => {
            if (activePeer) {
                setActivePeer(null);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [activePeer]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !activePeer) return;
        sendMutation.mutate({ to: activePeer.peer.id, content: input.trim() });
    };

    const isChatOpen = !!activePeer;

    return (
        <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden transition-colors duration-300">
            <Navbar className={cn(isChatOpen && "hidden md:flex")} />

            <main className="flex-1 overflow-hidden flex flex-col md:flex-row container mx-auto py-0 md:py-4 px-0 md:px-4 gap-4 max-w-7xl pb-24 md:pb-0">
                {/* Conversations Sidebar */}
                <div className={cn(
                    "w-full md:w-80 h-full flex flex-col gap-4 shrink-0 px-4 md:px-0 py-4 md:py-0 transition-all",
                    isChatOpen ? "hidden md:flex" : "flex"
                )}>
                    <Link href="/chat">
                        <Button size="lg" className="w-full h-14 rounded-2xl shadow-xl shadow-primary/10 font-black text-sm uppercase tracking-widest gap-3 bg-gradient-to-r from-primary to-indigo-600 hover:scale-[1.02] active:scale-[0.98] transition-all border-none">
                            <Video className="w-5 h-5" />
                            Start Anonymous
                            <Sparkles className="w-3 h-3 text-white/50" />
                        </Button>
                    </Link>

                    <div className="flex-1 rounded-3xl overflow-hidden glass-card border border-border relative">
                        {isLoadingConvs ? (
                            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                        ) : (
                            <Sidebar
                                conversations={convData?.conversations || []}
                                activePeerId={activePeer?.peer.id}
                                onSelectConversation={(conv) => {
                                    if (!activePeer) {
                                        window.history.pushState({ isChatOpen: true }, '', '');
                                    }
                                    setActivePeer(conv);
                                    markAsRead(conv.peer.id);
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={cn(
                    "flex-1 h-full md:rounded-3xl overflow-hidden glass-card border-x-0 md:border border-border flex flex-col relative bg-card/10 transition-all",
                    isChatOpen ? "flex" : "hidden md:flex"
                )}>
                    {!activePeer ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                <MessageSquare className="w-10 h-10 text-primary" />
                            </div>
                            <h2 className="text-2xl font-black mb-2">Your Inbox</h2>
                            <p className="text-muted-foreground max-w-xs font-medium">Select a vibe to start chatting or hit the anonymous button to meet someone new.</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-border bg-muted/30 backdrop-blur-3xl flex items-center justify-between shadow-sm z-10 transition-all">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            if (window.history.state?.isChatOpen) {
                                                window.history.back();
                                            } else {
                                                setActivePeer(null);
                                            }
                                        }}
                                        className="md:hidden -ml-2 rounded-xl text-muted-foreground"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </Button>
                                    <Avatar className="w-10 h-10 border border-primary/20 shadow-lg shrink-0">
                                        <AvatarImage src={activePeer.peer.avatar} />
                                        <AvatarFallback className="bg-muted text-primary">{activePeer.peer.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-sm tracking-tight truncate uppercase tracking-widest text-[10px]">{activePeer.peer.username}</h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Online</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={handleCall}
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-2xl w-10 h-10 md:w-12 md:h-12 bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/10"
                                    >
                                        <Video className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 custom-scrollbar">
                                <AnimatePresence initial={false}>
                                    {isLoadingMessages ? (
                                        <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                                    ) : messages?.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full py-20 text-center gap-3">
                                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                                                <MessageSquare className="w-7 h-7 text-primary/50" />
                                            </div>
                                            <p className="text-sm font-bold text-muted-foreground/50 uppercase tracking-widest">No messages yet</p>
                                            <p className="text-xs text-muted-foreground/30">Say hello! 👋</p>
                                        </div>
                                    ) : (
                                        messages?.map((msg: any, idx: number) => {
                                            // KEY FIX: compare against peer's DB id, not Supabase auth UUID
                                            const isMe = msg.senderId !== activePeer.peer.id;
                                            const prevMsg = messages[idx - 1];
                                            const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
                                            return (
                                                <motion.div
                                                    key={msg.id}
                                                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    transition={{ duration: 0.15 }}
                                                    className={cn(
                                                        "flex items-end gap-2 max-w-[80%] md:max-w-[70%]",
                                                        isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                                                    )}
                                                >
                                                    {/* Peer avatar — only on first of a group */}
                                                    {!isMe && (
                                                        <Avatar className={cn("w-7 h-7 shrink-0", !isFirstInGroup && "invisible")}>
                                                            <AvatarImage src={activePeer.peer.avatar} />
                                                            <AvatarFallback className="bg-muted text-primary text-[10px] font-black">
                                                                {activePeer.peer.username.slice(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}

                                                    <div className={cn("flex flex-col gap-0.5", isMe ? "items-end" : "items-start")}>
                                                        {/* Sender label on first bubble of group */}
                                                        {!isMe && isFirstInGroup && (
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-1 mb-0.5">
                                                                {activePeer.peer.username}
                                                            </span>
                                                        )}
                                                        <div className={cn(
                                                            "px-4 py-2.5 text-sm leading-relaxed shadow-sm break-words max-w-full",
                                                            isMe ? "msg-me" : "msg-them"
                                                        )}>
                                                            {msg.content}
                                                        </div>
                                                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30 px-1">
                                                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </AnimatePresence>
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input — sits above MobileNav (96px) on mobile */}
                            <form
                                className="p-3 md:p-4 border-t border-border bg-background/80 backdrop-blur-md flex gap-2 items-center z-10"
                                style={{ paddingBottom: 'calc(max(0.75rem, env(safe-area-inset-bottom)) + 6rem)' }}
                                onSubmit={handleSendMessage}
                            >
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSendMessage(e as any); }}
                                    placeholder="Message…"
                                    autoComplete="off"
                                    className="h-11 px-4 flex-1 rounded-2xl bg-muted/60 border-border/60 focus-visible:ring-primary/30 placeholder:text-muted-foreground/40 text-foreground text-sm"
                                />
                                <Button
                                    type="submit"
                                    disabled={!input.trim() || sendMutation.isPending}
                                    size="icon"
                                    className="rounded-2xl w-11 h-11 shrink-0 bg-primary hover:bg-primary/90 disabled:opacity-30 active:scale-95 transition-all shadow-md"
                                >
                                    {sendMutation.isPending
                                        ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                                        : <Send className="w-4 h-4 text-white" />
                                    }
                                </Button>
                            </form>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
