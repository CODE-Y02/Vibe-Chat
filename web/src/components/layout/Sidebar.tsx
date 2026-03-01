"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

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
}

export function Sidebar({ conversations, activePeerId, onSelectConversation, className }: SidebarProps) {
    return (
        <aside className={cn("w-full h-full flex flex-col bg-transparent", className)}>
            <div className="p-4 border-b border-border">
                <h2 className="text-lg font-black tracking-tight text-foreground uppercase tracking-widest text-xs">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar">
                {conversations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground/30 text-xs mt-10 font-bold uppercase tracking-widest">
                        No vibes yet
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <button
                            key={conv.peer.id}
                            onClick={() => onSelectConversation(conv)}
                            className={cn(
                                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left group relative outline-none",
                                activePeerId === conv.peer.id
                                    ? "bg-primary/10 border border-primary/20 shadow-xl shadow-primary/5"
                                    : "hover:bg-muted/50 border border-transparent"
                            )}
                        >
                            <div className="relative shrink-0">
                                <Avatar className="h-14 w-14 border border-border shadow-2xl">
                                    <AvatarImage src={conv.peer.avatar} alt={conv.peer.username} />
                                    <AvatarFallback className="bg-muted text-primary font-black uppercase text-sm">
                                        {conv.peer.username.slice(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                {conv.isUnread && (
                                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 border-2 border-background rounded-full shadow-lg"></span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <p className={cn(
                                        "text-sm font-black truncate transition-colors uppercase tracking-tight",
                                        conv.isUnread ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"
                                    )}>
                                        {conv.peer.username}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">
                                        {formatDistanceToNow(new Date(conv.createdAt), { addSuffix: false })}
                                    </span>
                                </div>
                                <p className={cn(
                                    "text-xs truncate transition-colors font-medium",
                                    conv.isUnread ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground/60"
                                )}>
                                    {conv.lastMessage}
                                </p>
                            </div>
                            {conv.isUnread && (
                                <div className="absolute left-1 w-1 h-8 bg-primary rounded-full" />
                            )}
                        </button>
                    ))
                )}
            </div>
        </aside>
    );
}
