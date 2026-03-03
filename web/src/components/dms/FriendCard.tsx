"use client";

interface LocalUser {
    id: string;
    username: string;
    avatar?: string;
    status: 'online' | 'offline' | 'idle';
}

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, X, MessageSquare, UserMinus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface FriendCardProps {
    friend: LocalUser;
    type?: 'friend' | 'request';
    onAccept?: (id: string) => void;
    onReject?: (id: string) => void;
    onMessage?: (friend: LocalUser) => void;
    onRemove?: (id: string) => void;
}

export function FriendCard({ friend, type = 'friend', onAccept, onReject, onMessage, onRemove }: FriendCardProps) {
    const initials = friend.username?.slice(0, 2).toUpperCase() || 'VB';

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.05] transition-all duration-300 group"
        >
            {/* Avatar + Status */}
            <div className="relative flex-shrink-0">
                <Avatar className="w-12 h-12 ring-2 ring-white/5 ring-offset-2 ring-offset-[#020202]">
                    <AvatarImage src={friend.avatar} alt={friend.username} />
                    <AvatarFallback className="bg-primary/15 text-primary font-black text-sm">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <span className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-[#020202] rounded-full",
                    friend.status === 'online'
                        ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                        : friend.status === 'idle'
                        ? "bg-amber-500"
                        : "bg-zinc-600"
                )} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-white truncate uppercase tracking-tight leading-none">
                    {friend.username}
                </p>
                <p className={cn(
                    "text-[10px] font-bold uppercase tracking-widest mt-1 leading-none",
                    friend.status === 'online' ? "text-emerald-500" : "text-white/25"
                )}>
                    {type === 'request' ? '· Wants to connect' : friend.status === 'online' ? '· Active now' : '· Offline'}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {type === 'request' ? (
                    <>
                        <Button
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); onAccept?.(friend.id); }}
                            className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-[11px] uppercase tracking-widest shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95"
                        >
                            <Check className="w-4 h-4 mr-1.5" /> Accept
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); onReject?.(friend.id); }}
                            className="h-9 w-9 rounded-xl text-white/30 hover:text-red-500 hover:bg-red-500/10 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); onMessage?.(friend); }}
                            className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/80 text-white font-black text-[11px] uppercase tracking-widest shadow-glow-sm transition-all hover:scale-105 active:scale-95"
                        >
                            <MessageSquare className="w-4 h-4 mr-1.5" /> Message
                        </Button>
                        {onRemove && (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); onRemove?.(friend.id); }}
                                className="h-9 w-9 rounded-xl text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <UserMinus className="w-4 h-4" />
                            </Button>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    );
}
