"use client";

import { useState, useRef, useEffect } from 'react';
import { useChatStore, Message } from '@/store/useChatStore';
import { socket } from '@/lib/socket';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Smile, Maximize2, Minimize2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
    return (
        <div className={cn("flex w-full mb-2", isOwn ? "justify-end" : "justify-start")}>
            <div className={cn(
                "max-w-[80%] px-4 py-2 rounded-2xl shadow-xl text-sm transition-all",
                isOwn
                    ? "bg-primary text-white rounded-tr-sm"
                    : "bg-white/10 text-white/90 rounded-tl-sm border border-white/5 backdrop-blur-md"
            )}>
                {message.text}
            </div>
        </div>
    );
}

export function ChatBox() {
    const { data: sessionData } = useSession();
    const [text, setText] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const { session, addMessage } = useChatStore();
    const bottomRef = useRef<HTMLDivElement>(null);

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

    if (isMinimized) {
        return (
            <div className="fixed bottom-10 right-10 w-80 z-50">
                <Button
                    onClick={() => setIsMinimized(false)}
                    className="w-full h-14 rounded-3xl shadow-2xl glass-card border-white/10 flex items-center justify-between px-6 bg-primary text-white hover:scale-[1.02] transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                        <span className="font-black text-xs uppercase tracking-widest">Chat ({session.messages.length})</span>
                    </div>
                    <Maximize2 className="w-4 h-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full rounded-[40px] overflow-hidden glass-card shadow-2xl border border-white/10 relative bg-white/[0.02] backdrop-blur-2xl">
            {!session.isMatched ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center shadow-inner relative">
                        <Smile className="w-10 h-10 text-white/20" />
                        <div className="absolute inset-0 border border-white/5 rounded-full animate-ping" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black tracking-tight uppercase mb-2">Private Vibe</h3>
                        <p className="text-xs text-white/30 font-medium tracking-wide max-w-[200px] mx-auto leading-relaxed">
                            Messages are encrypted and ephemeral. Connect to start.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Chat Header */}
                    <div className="p-5 border-b border-white/5 bg-white/[0.03] flex items-center justify-between shadow-sm z-10 backdrop-blur-xl">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Avatar className="w-10 h-10 border border-white/10 shadow-lg">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session.strangerId}`} />
                                    <AvatarFallback className="bg-primary/20 text-primary font-bold">S</AvatarFallback>
                                </Avatar>
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#131313] rounded-full"></span>
                            </div>
                            <div>
                                <h3 className="font-black text-xs tracking-widest uppercase text-white/80">Stranger</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[9px] text-primary font-black uppercase tracking-widest">Connected</span>
                                </div>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsMinimized(true)} className="h-10 w-10 rounded-2xl hover:bg-white/5 text-white/40 hover:text-white transition-all">
                            <Minimize2 className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-2 no-scrollbar bg-gradient-to-b from-transparent to-primary/[0.02]">
                        {session.messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-20">
                                <Smile className="w-8 h-8" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-center">Vibe Secure</span>
                            </div>
                        ) : (
                            session.messages.map((msg: Message) => (
                                <MessageBubble
                                    key={msg.id}
                                    message={msg}
                                    isOwn={msg.senderId === (sessionData?.user?.id || 'me')}
                                />
                            ))
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input Area */}
                    <form className="p-5 border-t border-white/5 bg-white/[0.03] flex gap-3 items-center z-10" onSubmit={handleSend}>
                        <Input
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Drop a vibe..."
                            className="flex-1 h-12 rounded-2xl bg-white/5 border-white/10 focus-visible:ring-primary/20 text-sm placeholder:text-white/20"
                            disabled={!session.isMatched}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="rounded-2xl w-12 h-12 shrink-0 shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all bg-primary"
                            disabled={!text.trim() || !session.isMatched}
                        >
                            <Send className="w-5 h-5" />
                        </Button>
                    </form>
                </>
            )}
        </div>
    );
}
