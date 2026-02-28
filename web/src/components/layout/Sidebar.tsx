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
            <div className="p-4 border-b border-white/5">
                <h2 className="text-lg font-bold tracking-tight text-white">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
                {conversations.length === 0 ? (
                    <div className="p-4 text-center text-white/30 text-xs mt-10">
                        No conversations yet
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <button
                            key={conv.peer.id}
                            onClick={() => onSelectConversation(conv)}
                            className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 text-left group",
                                activePeerId === conv.peer.id
                                    ? "bg-primary/20 border border-primary/20 shadow-lg shadow-primary/5"
                                    : "hover:bg-white/5 border border-transparent"
                            )}
                        >
                            <div className="relative">
                                <Avatar className="h-12 w-12 border border-white/10 shadow-xl">
                                    <AvatarImage src={conv.peer.avatar} alt={conv.peer.username} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                        {conv.peer.username.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                {conv.isUnread && (
                                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-[#0a0a0a] rounded-full"></span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <p className={cn(
                                        "text-sm font-bold truncate transition-colors",
                                        conv.isUnread ? "text-white" : "text-white/80 group-hover:text-white"
                                    )}>
                                        {conv.peer.username}
                                    </p>
                                    <span className="text-[10px] text-white/30 font-medium">
                                        {formatDistanceToNow(new Date(conv.createdAt), { addSuffix: false })}
                                    </span>
                                </div>
                                <p className={cn(
                                    "text-xs truncate transition-colors",
                                    conv.isUnread ? "text-primary font-bold" : "text-white/40 group-hover:text-white/60"
                                )}>
                                    {conv.lastMessage}
                                </p>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </aside>
    );
}
