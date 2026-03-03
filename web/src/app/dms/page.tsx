"use client";

import { useEffect, useState, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar, Conversation } from '@/components/layout/Sidebar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConversations, getMessages, sendMessage, markAsRead } from '@/actions/dm.actions';
import { Loader2, MessageSquare, Send, Video, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSocket } from '@/hooks/use-socket';
import { useSession } from "@/components/layout/SessionProvider";
import { useChatStore } from '@/store/useChatStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function DMsPage() {
    const { data: session, status } = useSession();
    const queryClient = useQueryClient();
    const router = useRouter();

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

    const { data: convData, isLoading: isLoadingConvs } = useQuery({
        queryKey: ['conversations'],
        queryFn: () => getConversations()
    });

    const { data: messages, isLoading: isLoadingMessages } = useQuery({
        queryKey: ['messages', activePeer?.peer.id],
        queryFn: () => activePeer ? getMessages(activePeer.peer.id) : [],
        enabled: !!activePeer
    });

    const sendMutation = useMutation({
        mutationFn: ({ to, content }: { to: string, content: string }) => sendMessage(to, content),
        onSuccess: () => {
            setInput("");
            queryClient.invalidateQueries({ queryKey: ['messages', activePeer?.peer.id] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
    });

    useEffect(() => {
        if (socket && activePeer) {
            socket.on('message', (msg: any) => {
                if (msg.senderId === activePeer.peer.id || msg.receiverId === activePeer.peer.id) {
                    queryClient.invalidateQueries({ queryKey: ['messages', activePeer.peer.id] });
                }
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
            });

            return () => {
                socket.off('message');
            };
        }
    }, [socket, activePeer, queryClient]);

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

            <main className="flex-1 overflow-hidden flex flex-col md:flex-row container mx-auto py-0 md:py-4 px-0 md:px-4 gap-4 max-w-7xl">
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
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gradient-to-b from-transparent to-primary/[0.02]">
                                <AnimatePresence initial={false}>
                                    {isLoadingMessages ? (
                                        <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                                    ) : (
                                        messages?.map((msg: any) => {
                                            const isMe = msg.senderId === session?.user?.id;
                                            return (
                                                <motion.div
                                                    key={msg.id}
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    className={cn("flex flex-col max-w-[85%] md:max-w-[75%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}
                                                >
                                                    <div className={cn(
                                                        "px-5 py-3 rounded-2xl text-sm shadow-xl transition-all relative overflow-hidden",
                                                        isMe
                                                            ? "bg-primary text-white rounded-tr-sm font-medium glow-sm bg-vibe-gradient"
                                                            : "bg-muted text-foreground border border-border rounded-tl-sm backdrop-blur-md"
                                                    )}>
                                                        {msg.content}
                                                    </div>
                                                    <span className="text-[9px] text-muted-foreground/50 mt-1 font-black uppercase tracking-widest px-1">
                                                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                                    </span>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </AnimatePresence>
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <form className="p-4 border-t border-border bg-muted/30 flex gap-3 items-center z-10" onSubmit={handleSendMessage}>
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your message..."
                                    className="h-12 px-6 flex-1 rounded-2xl bg-muted border-border focus-visible:ring-primary/20 placeholder:text-muted-foreground/30 text-foreground"
                                />
                                <Button
                                    type="submit"
                                    disabled={!input.trim() || sendMutation.isPending}
                                    size="icon"
                                    className="rounded-2xl w-12 h-12 shrink-0 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform bg-primary"
                                >
                                    <Send className="w-5 h-5 text-white" />
                                </Button>
                            </form>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
