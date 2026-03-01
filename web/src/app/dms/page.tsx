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
import { useSession } from 'next-auth/react';
import { useChatStore } from '@/store/useChatStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

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

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !activePeer) return;
        sendMutation.mutate({ to: activePeer.peer.id, content: input.trim() });
    };

    return (
        <div className="h-screen flex flex-col bg-[#050505] text-white overflow-hidden">
            <Navbar />

            <main className="flex-1 overflow-hidden flex flex-col md:flex-row container mx-auto py-4 px-4 gap-4 max-w-7xl">
                {/* Conversations Sidebar */}
                <div className="w-full md:w-80 h-full flex flex-col gap-4 shrink-0">
                    <Link href="/chat">
                        <Button size="lg" className="w-full h-14 rounded-2xl shadow-xl shadow-primary/10 font-black text-sm uppercase tracking-widest gap-3 bg-gradient-to-r from-primary to-indigo-600 hover:scale-[1.02] active:scale-[0.98] transition-all border-none">
                            <Video className="w-5 h-5" />
                            Start Anonymous
                            <Sparkles className="w-3 h-3 text-white/50" />
                        </Button>
                    </Link>

                    <div className="flex-1 rounded-3xl overflow-hidden glass-card border border-white/5 relative">
                        {isLoadingConvs ? (
                            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                        ) : (
                            <Sidebar
                                conversations={convData?.conversations || []}
                                activePeerId={activePeer?.peer.id}
                                onSelectConversation={(conv) => {
                                    setActivePeer(conv);
                                    markAsRead(conv.peer.id);
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 h-full rounded-3xl overflow-hidden glass-card border border-white/5 flex flex-col relative bg-white/[0.02]">
                    {!activePeer ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                <MessageSquare className="w-10 h-10 text-primary" />
                            </div>
                            <h2 className="text-2xl font-black mb-2">Your Inbox</h2>
                            <p className="text-white/40 max-w-xs">Select a vibe to start chatting or hit the anonymous button to meet someone new.</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-white/5 bg-white/[0.03] backdrop-blur-3xl flex items-center justify-between shadow-sm z-10">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10 border border-white/10 shadow-lg">
                                        <AvatarImage src={activePeer.peer.avatar} />
                                        <AvatarFallback>{activePeer.peer.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-bold text-sm tracking-tight">{activePeer.peer.username}</h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                            <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Online</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={handleCall}
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-2xl w-12 h-12 bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/10"
                                    >
                                        <Video className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-gradient-to-b from-transparent to-primary/[0.02]">
                                {isLoadingMessages ? (
                                    <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                                ) : (
                                    messages?.map((msg: any) => {
                                        const isMe = msg.senderId === session?.user?.id;
                                        return (
                                            <div key={msg.id} className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                                                <div className={cn(
                                                    "px-4 py-2.5 rounded-2xl text-sm shadow-xl transition-all",
                                                    isMe
                                                        ? "bg-primary text-white rounded-tr-sm"
                                                        : "bg-white/5 text-white/90 border border-white/5 rounded-tl-sm backdrop-blur-md"
                                                )}>
                                                    {msg.content}
                                                </div>
                                                <span className="text-[9px] text-white/20 mt-1 font-bold uppercase tracking-tighter px-1">
                                                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <form className="p-4 border-t border-white/5 bg-white/[0.03] flex gap-3 items-center z-10" onSubmit={handleSendMessage}>
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your message..."
                                    className="h-12 flex-1 rounded-2xl bg-white/5 border-white/10 focus-visible:ring-primary/20 placeholder:text-white/20"
                                />
                                <Button
                                    type="submit"
                                    disabled={!input.trim() || sendMutation.isPending}
                                    size="icon"
                                    className="rounded-2xl w-12 h-12 shrink-0 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform bg-primary"
                                >
                                    <Send className="w-5 h-5" />
                                </Button>
                            </form>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
