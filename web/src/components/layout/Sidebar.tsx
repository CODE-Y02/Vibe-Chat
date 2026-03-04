"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatTime } from "@/lib/utils";

export interface Conversation {
    peer: {
        id: string;
        username: string;
        avatar?: string;
    };
    lastMessage: string;
    createdAt: string;
    isUnread: boolean;
}

interface SidebarProps {
    conversations: Conversation[];
    activePeerId?: string;
    onSelectConversation: (conversation: Conversation) => void;
    className?: string;
    onEndReached?: () => void;
    isFetchingNextPage?: boolean;
}

import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function Sidebar({ conversations, activePeerId, onSelectConversation, className, onEndReached, isFetchingNextPage }: SidebarProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredConversations = conversations.filter(c =>
        c.peer?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            onEndReached?.();
        }
    };

    return (
        <aside className={cn("w-full h-full flex flex-col bg-transparent", className)}>
            <div className="p-6 border-b border-border space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black tracking-tight text-foreground uppercase tracking-widest text-[10px]">Messages</h2>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-tighter shadow-glow-sm">
                        {conversations.length} Active
                    </span>
                </div>
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search vibes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-10 pl-10 pr-4 rounded-xl bg-muted/50 border-transparent focus-visible:border-primary/30 focus-visible:ring-0 text-xs font-medium placeholder:text-muted-foreground/30 transition-all"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar pb-28 md:pb-2" onScroll={handleScroll}>
                {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground/30 text-xs mt-10 font-bold uppercase tracking-widest">
                        No vibes yet
                    </div>
                ) : (
                    <>
                        {filteredConversations.map((conv) => (
                            <button
                                key={conv.peer?.id || conv.createdAt}
                                onClick={() => onSelectConversation(conv)}
                                className={cn(
                                    "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 text-left group relative outline-none",
                                    activePeerId === conv.peer?.id
                                        ? "bg-primary/10 border border-primary/20 shadow-xl shadow-primary/5"
                                        : "hover:bg-muted/50 border border-transparent"
                                )}
                            >
                                <div className="relative shrink-0">
                                    <Avatar className={cn(
                                        "h-14 w-14 border border-border shadow-2xl transition-transform duration-500",
                                        activePeerId === conv.peer?.id ? "scale-105 border-primary/50" : "group-hover:scale-105"
                                    )}>
                                        <AvatarImage src={conv.peer?.avatar} alt={conv.peer?.username} />
                                        <AvatarFallback className="bg-muted text-primary font-black uppercase text-sm">
                                            {conv.peer?.username ? conv.peer.username.slice(0, 2) : '??'}
                                        </AvatarFallback>
                                    </Avatar>
                                    {conv.isUnread && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary border-2 border-background rounded-full shadow-lg shadow-primary/20"></span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className={cn(
                                            "text-xs font-black truncate transition-colors uppercase tracking-[0.1em]",
                                            conv.isUnread ? "text-primary" : "text-foreground group-hover:text-foreground"
                                        )}>
                                            {conv.peer?.username || 'Unknown Vibe'}
                                        </p>
                                        <span className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest bg-muted rounded-full px-2 py-0.5 whitespace-nowrap">
                                            {formatTime(conv.createdAt)}
                                        </span>
                                    </div>
                                    <p className={cn(
                                        "text-[11px] truncate transition-colors font-medium tracking-tight",
                                        conv.isUnread ? "text-foreground font-bold" : "text-muted-foreground group-hover:text-foreground/60"
                                    )}>
                                        {conv.lastMessage}
                                    </p>
                                </div>
                                {activePeerId === conv.peer?.id && (
                                    <div className="absolute left-1 w-1 h-8 bg-primary rounded-full shadow-[0_0_10px_hsla(var(--primary)/0.5)]" />
                                )}
                            </button>
                        ))}
                        {isFetchingNextPage && (
                            <div className="flex justify-center p-4">
                                <Loader2 className="w-5 h-5 animate-spin text-primary/50" />
                            </div>
                        )}
                    </>
                )}
            </div>
        </aside>
    );
}
