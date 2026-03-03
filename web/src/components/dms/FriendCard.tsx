"use client";

interface LocalUser {
    id: string;
    username: string;
    avatar?: string;
    status: 'online' | 'offline' | 'idle';
}
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FriendCardProps {
    friend: LocalUser;
    type?: 'friend' | 'request';
    onAccept?: (id: string) => void;
    onReject?: (id: string) => void;
    onMessage?: (friend: LocalUser) => void;
}

export function FriendCard({ friend, type = 'friend', onAccept, onReject, onMessage }: FriendCardProps) {
    return (
        <Card className="p-4 flex items-center justify-between glass-card border border-white/5 hover:border-primary/20 transition-all rounded-3xl group shadow-lg">
            <div className="flex items-center gap-4 min-w-0">
                <div className="relative flex-shrink-0">
                    <Avatar className="w-14 h-14 border-2 border-primary/10 shadow-glow-sm">
                        <AvatarImage src={friend.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary font-black text-sm uppercase">
                            {friend.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span className={cn(
                        "absolute bottom-0.5 right-0.5 w-4 h-4 border-4 border-[#0a0a0a] rounded-full",
                        friend.status === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
                        friend.status === 'idle' ? "bg-amber-500" : "bg-zinc-600"
                    )}></span>
                </div>
                <div className="min-w-0">
                    <h4 className="font-black text-base tracking-tight truncate uppercase italic">{friend.username}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                        <div className={cn(
                            "w-1.5 h-1.5 rounded-full animate-pulse",
                            friend.status === 'online' ? "bg-emerald-500" : "bg-zinc-500"
                        )} />
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">
                            {friend.status === 'online' ? "Vibing Now" : friend.status}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex gap-2.5 ml-4">
                {type === 'request' ? (
                    <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 transform sm:translate-x-2 sm:group-hover:translate-x-0">
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="rounded-2xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all h-10 w-10 shadow-glow-sm" 
                            onClick={(e) => { e.stopPropagation(); onAccept?.(friend.id); }}
                        >
                            <Check className="w-5 h-5" />
                        </Button>
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all h-10 w-10 shadow-glow-sm" 
                            onClick={(e) => { e.stopPropagation(); onReject?.(friend.id); }}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                ) : (
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all h-10 w-10 sm:opacity-0 sm:group-hover:opacity-100 transform sm:translate-x-2 sm:group-hover:translate-x-0 shadow-glow-sm" 
                        onClick={(e) => { e.stopPropagation(); onMessage?.(friend); }}
                    >
                        <MessageSquare className="w-5 h-5" />
                    </Button>
                )}
            </div>
        </Card>
    );
}
