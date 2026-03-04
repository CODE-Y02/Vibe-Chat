"use client";

import { useState, useRef, useEffect, memo } from 'react';
import { useChatStore, Message } from '@/store/useChatStore';
import { socket } from '@/lib/socket';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Smile, Maximize2, Minimize2, Shield, UserPlus, Check, Loader2, Flag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useSession } from "@/components/layout/SessionProvider";
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendFriendRequest } from '@/actions/friend.actions';
import { sendMessage } from '@/actions/dm.actions';
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
                    ? "bg-vibe-gradient text-primary-foreground rounded-tr-sm"
                    : "bg-muted/40 text-foreground rounded-tl-sm border border-border backdrop-blur-md"
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

export const ChatBox = memo(({ onReport }: ChatBoxProps = {}) => {
    const { data: sessionData } = useSession();
    const [text, setText] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    // Select specific state to minimize re-renders
    const session = useChatStore(state => state.session);
    const addMessage = useChatStore(state => state.addMessage);

    const queryClient = useQueryClient();
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
            // behavior: auto is much faster for high-frequency updates than smooth
            bottomRef.current?.scrollIntoView({ behavior: 'auto' });
        }
    }, [session.messages, isMinimized]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = text.trim();
        if (!content || !session.isMatched || !session.strangerId) return;

        const myId = sessionData?.internalId || 'me';
        const message: Message = {
            id: Date.now().toString(),
            senderId: myId,
            text: content,
            timestamp: Date.now()
        };

        addMessage(message);
        
        // Stop typing immediately on send
        socket.emit('typing', { to: session.strangerId, isTyping: false });

        if (session.isDirectCall) {
            try {
                await sendMessage(session.strangerId, content);
                queryClient.invalidateQueries({ queryKey: ["messages", session.strangerId] });
            } catch (err) {
                console.error("Failed to persist call message", err);
            }
        } else {
            socket.emit('sendMessage', { to: session.strangerId, content });
        }
        
        setText('');
    };

    // 🟢 PREMIUM: Typing Indicator Logic
    useEffect(() => {
        if (!session.strangerId || !session.isMatched) return;

        const isTyping = text.length > 0;
        const timeout = setTimeout(() => {
            socket.emit('typing', { to: session.strangerId, isTyping });
        }, 300); // Debounce typing trigger

        return () => clearTimeout(timeout);
    }, [text, session.strangerId, session.isMatched]);

    return (
        <AnimatePresence mode="wait">
            {isMinimized ? (
                <motion.div
                    key="minimized"
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 20 }}
                    className="absolute bottom-4 right-4 md:bottom-12 md:right-12 w-[calc(100%-2rem)] md:w-80 z-50 pointer-events-auto"
                >
                    <Button
                        onClick={() => setIsMinimized(false)}
                        className="w-full h-14 md:h-16 rounded-2xl md:rounded-[2rem] shadow-glow glass border-border/50 flex items-center justify-between px-6 md:px-8 bg-primary text-primary-foreground hover:scale-[1.02] transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-glow-sm" />
                            <span className="font-black text-[10px] md:text-xs uppercase tracking-[0.2em]">Live Chat ({session.messages.length})</span>
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
                    className="flex flex-col h-full rounded-t-[2.5rem] md:rounded-[3rem] overflow-hidden glass-card border border-border/20 relative bg-card/60 backdrop-blur-3xl pointer-events-auto"
                >
                    {!session.isMatched ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 md:p-12 space-y-6 md:space-y-8">
                            <motion.div
                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                                className="w-16 h-16 md:w-24 md:h-24 bg-muted/40 rounded-full flex items-center justify-center relative border border-border"
                            >
                                <Shield className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/30" />
                            </motion.div>
                            <div>
                                <h3 className="text-lg md:text-xl font-black tracking-tight uppercase mb-2 md:mb-3 italic text-gradient px-4">Private Vibe</h3>
                                <p className="text-[9px] md:text-[10px] text-muted-foreground font-bold tracking-[0.2em] max-w-[200px] md:max-w-[220px] mx-auto leading-relaxed uppercase">
                                    End-to-end encryption active. Messages are ephemeral.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 md:p-6 border-b border-border bg-muted/20 flex items-center justify-between z-10">
                                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                    <div className="relative shrink-0">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="relative"
                                        >
                                            <Avatar className="w-10 h-10 md:w-12 md:h-12 border border-border shadow-lg">
                                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session.strangerId}`} />
                                                <AvatarFallback className="bg-primary/20 text-primary font-bold">S</AvatarFallback>
                                            </Avatar>
                                            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 md:w-3.5 md:h-3.5 bg-emerald-500 border-2 md:border-[3px] border-card rounded-full"></span>
                                        </motion.div>
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-foreground/80 truncate">
                                            {session.isDirectCall ? (session.peerName || 'Friend') : 'Stranger'}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[8px] md:text-[9px] text-primary font-black uppercase tracking-widest">Live Connection</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 md:gap-2">
                                    <Button
                                        onClick={onReport}
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 md:h-12 md:w-12 rounded-xl md:rounded-2xl transition-all border bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                                    >
                                        <Flag className="w-4 h-4 md:w-5 md:h-5" />
                                    </Button>
                                    <Button
                                        onClick={handleAddFriend}
                                        disabled={friendMutation.isPending || friendMutation.isSuccess}
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "h-9 w-9 md:h-12 md:w-12 rounded-xl md:rounded-2xl transition-all border",
                                            friendMutation.isSuccess
                                                ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/20"
                                                : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/60 border-border"
                                        )}
                                    >
                                        {friendMutation.isPending ? (
                                            <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                                        ) : friendMutation.isSuccess ? (
                                            <Check className="w-4 h-4 md:w-5 md:h-5" />
                                        ) : (
                                            <UserPlus className="w-4 h-4 md:w-5 md:h-5" />
                                        )}
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => setIsMinimized(true)} className="h-9 w-9 md:h-12 md:w-12 rounded-xl md:rounded-2xl hover:bg-muted text-muted-foreground/40 hover:text-foreground transition-all">
                                        <Minimize2 className="w-4 h-4 md:w-5 md:h-5" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-1 no-scrollbar bg-gradient-to-b from-transparent to-primary/[0.03] relative">
                                <AnimatePresence initial={false}>
                                    {session.messages.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="h-full flex flex-col items-center justify-center space-y-3 md:space-y-4 opacity-20"
                                        >
                                            <Smile className="w-8 h-8 md:w-10 md:h-10" />
                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-center px-4">Vibe Check Passed</span>
                                        </motion.div>
                                    ) : (
                                        session.messages.map((msg: Message) => (
                                            <MessageBubble
                                                key={msg.id}
                                                message={msg}
                                                isOwn={msg.senderId === (sessionData?.internalId || 'me')}
                                            />
                                        ))
                                    )}
                                </AnimatePresence>
                                <div ref={bottomRef} className="h-10" />
                                
                                {/* 🟢 PREMIUM: PEER TYING INDICATOR */}
                                <AnimatePresence>
                                    {session.isPeerTyping && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute bottom-24 left-8 flex items-center gap-2"
                                        >
                                            <div className="flex gap-1 bg-muted/20 backdrop-blur-xl border border-border/10 p-2.5 rounded-full rounded-bl-sm">
                                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
                                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary/30 rounded-full" />
                                            </div>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground animate-pulse leading-none">Vibe Buddy Typing...</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <form className="p-4 md:p-6 border-t border-border bg-muted/20 flex gap-3 md:gap-4 items-center z-10" onSubmit={handleSend}>

                                <Input
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Drop a vibe..."
                                    className="flex-1 h-12 md:h-14 px-4 md:px-6 rounded-xl md:rounded-2xl bg-muted/40 border-border focus-visible:ring-primary/20 focus-visible:border-primary/50 text-xs md:text-sm placeholder:text-muted-foreground/30 transition-all font-medium text-foreground"
                                    disabled={!session.isMatched}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="rounded-xl md:rounded-2xl w-12 h-12 md:w-14 md:h-14 shrink-0 shadow-glow bg-vibe-gradient transition-all overflow-hidden relative"
                                    disabled={!text.trim() || !session.isMatched}
                                >
                                    <Send className="w-5 h-5 md:w-6 md:h-6 relative z-10" />
                                </Button>
                            </form>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
});

ChatBox.displayName = 'ChatBox';
