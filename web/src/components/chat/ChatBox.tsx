"use client";

import { useState, useRef, useEffect } from 'react';
import { useChatStore, Message } from '@/store/useChatStore';
import { socket } from '@/lib/socket';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Smile, Maximize2, Minimize2, Shield, UserPlus, Check, Loader2, Flag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { sendFriendRequest } from '@/actions/friend.actions';
import { toast } from '@/hooks/use-toast';

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn("flex w-full mb-3", isOwn ? "justify-end" : "justify-start")}
        >
            <div className={cn(
                "max-w-[85%] px-5 py-3 rounded-[24px] shadow-xl text-sm transition-all relative overflow-hidden",
                isOwn
                    ? "bg-vibe-gradient text-white rounded-tr-sm"
                    : "bg-white/[0.05] text-white/90 rounded-tl-sm border border-white/10 backdrop-blur-md"
            )}>
                {message.text}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
            </div>
        </motion.div>
    );
}

interface ChatBoxProps {
    onReport?: () => void;
}

export function ChatBox({ onReport }: ChatBoxProps = {}) {
    const { data: sessionData } = useSession();
    const [text, setText] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const { session, addMessage } = useChatStore();
    const bottomRef = useRef<HTMLDivElement>(null);

    const friendMutation = useMutation({
        mutationFn: (friendId: string) => sendFriendRequest(friendId),
        onSuccess: (data) => {
            if (data.success) {
                toast({
                    title: "Vibe Connected!",
                    description: "Friend request sent successfully.",
                    className: "bg-vibe-gradient text-white border-none shadow-glow"
                });
            } else {
                toast({
                    title: "Oops!",
                    description: data.error || "Failed to send request.",
                    variant: "destructive"
                });
            }
        }
    });

    const handleAddFriend = () => {
        if (session.strangerId) {
            friendMutation.mutate(session.strangerId);
        }
    };

    useEffect(() => {
        if (!isMinimized) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [session.messages, isMinimized]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !session.isMatched || !session.strangerId) return;

        const message: Message = {
            id: Date.now().toString(),
            senderId: sessionData?.user?.id || 'me',
            text: text.trim(),
            timestamp: Date.now()
        };

        addMessage(message);
        socket.emit('sendMessage', { to: session.strangerId, content: text.trim() });
        setText('');
    };

    return (
        <AnimatePresence mode="wait">
            {isMinimized ? (
                <motion.div
                    key="minimized"
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 20 }}
                    className="fixed bottom-12 right-12 w-80 z-50"
                >
                    <Button
                        onClick={() => setIsMinimized(false)}
                        className="w-full h-16 rounded-[2rem] shadow-glow glass border-white/10 flex items-center justify-between px-8 bg-primary text-white hover:scale-[1.02] transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                            <span className="font-black text-xs uppercase tracking-[0.2em]">Chat ({session.messages.length})</span>
                        </div>
                        <Maximize2 className="w-4 h-4" />
                    </Button>
                </motion.div>
            ) : (
                <motion.div
                    key="maximized"
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.95 }}
                    className="flex flex-col h-full rounded-[48px] overflow-hidden glass-card border border-white/5 relative bg-[#0a0a0a]/40 backdrop-blur-3xl"
                >
                    {!session.isMatched ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-8">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 3 }}
                                className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center relative border border-white/5"
                            >
                                <Shield className="w-10 h-10 text-white/20" />
                                <div className="absolute inset-0 border border-primary/20 rounded-full animate-ping" />
                            </motion.div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight uppercase mb-3 italic text-gradient">Private Vibe</h3>
                                <p className="text-[10px] text-white/30 font-bold tracking-[0.2em] max-w-[220px] mx-auto leading-relaxed uppercase">
                                    End-to-end encryption active. Messages are ephemeral.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between z-10">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="relative"
                                        >
                                            <Avatar className="w-12 h-12 border border-white/10 shadow-lg">
                                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session.strangerId}`} />
                                                <AvatarFallback className="bg-primary/20 text-primary font-bold">S</AvatarFallback>
                                            </Avatar>
                                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-[3px] border-[#0a0a0a] rounded-full"></span>
                                        </motion.div>
                                    </div>
                                    <div>
                                        <h3 className="font-black text-[10px] tracking-[0.2em] uppercase text-white/80">Stranger</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] text-primary font-black uppercase tracking-widest">Live Connection</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                            onClick={onReport}
                                            variant="ghost"
                                            size="icon"
                                            className="h-12 w-12 rounded-2xl transition-all border bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                                            title="Report User"
                                        >
                                            <Flag className="w-5 h-5" />
                                        </Button>
                                    </motion.div>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                            onClick={handleAddFriend}
                                            disabled={friendMutation.isPending || friendMutation.isSuccess}
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-12 w-12 rounded-2xl transition-all border",
                                                friendMutation.isSuccess
                                                    ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/20"
                                                    : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border-white/5"
                                            )}
                                            title="Add as Friend"
                                        >
                                            {friendMutation.isPending ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : friendMutation.isSuccess ? (
                                                <Check className="w-5 h-5" />
                                            ) : (
                                                <UserPlus className="w-5 h-5" />
                                            )}
                                        </Button>
                                    </motion.div>
                                    <Button variant="ghost" size="icon" onClick={() => setIsMinimized(true)} className="h-12 w-12 rounded-2xl hover:bg-white/5 text-white/20 hover:text-white transition-all">
                                        <Minimize2 className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-1 no-scrollbar bg-gradient-to-b from-transparent to-primary/[0.03]">
                                <AnimatePresence initial={false}>
                                    {session.messages.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="h-full flex flex-col items-center justify-center space-y-4 opacity-20"
                                        >
                                            <Smile className="w-10 h-10" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Vibe Check Passed</span>
                                        </motion.div>
                                    ) : (
                                        session.messages.map((msg: Message) => (
                                            <MessageBubble
                                                key={msg.id}
                                                message={msg}
                                                isOwn={msg.senderId === (sessionData?.user?.id || 'me')}
                                            />
                                        ))
                                    )}
                                </AnimatePresence>
                                <div ref={bottomRef} />
                            </div>

                            {/* Input Area */}
                            <form className="p-6 border-t border-white/5 bg-white/[0.02] flex gap-4 items-center z-10" onSubmit={handleSend}>
                                <Input
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Drop a vibe..."
                                    className="flex-1 h-14 rounded-2xl bg-white/[0.05] border-white/10 focus-visible:ring-primary/20 focus-visible:border-primary/50 text-sm placeholder:text-white/20 transition-all font-medium"
                                    disabled={!session.isMatched}
                                />
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        type="submit"
                                        size="icon"
                                        className="rounded-2xl w-14 h-14 shrink-0 shadow-glow bg-vibe-gradient transition-all overflow-hidden relative shimmer border-none"
                                        disabled={!text.trim() || !session.isMatched}
                                    >
                                        <Send className="w-6 h-6 relative z-10" />
                                    </Button>
                                </motion.div>
                            </form>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

<style jsx global>{`
    @keyframes shimmer {
        100% { transform: translateX(100%); }
    }
`}</style>

