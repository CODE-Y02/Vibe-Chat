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
        <Card className="p-4 flex items-center justify-between glass-card border-none hover:bg-card/80 transition-all rounded-2xl group">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Avatar className="w-12 h-12 border-2 border-background shadow-md">
                        <AvatarImage src={friend.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{friend.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {friend.status === 'online' && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"></span>
                    )}
                </div>
                <div>
                    <h4 className="font-semibold text-sm tracking-tight">{friend.username}</h4>
                    <p className="text-xs text-muted-foreground capitalize flex items-center gap-1.5 mt-0.5">
                        <span className={cn("w-1.5 h-1.5 rounded-full", friend.status === 'online' ? "bg-green-500" : "bg-slate-300")} />
                        {friend.status}
                    </p>
                </div>
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {type === 'request' ? (
                    <>
                        <Button size="icon" variant="ghost" className="rounded-full bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-colors h-8 w-8" onClick={() => onAccept?.(friend.id)}>
                            <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="rounded-full bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-colors h-8 w-8" onClick={() => onReject?.(friend.id)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </>
                ) : (
                    <Button size="icon" variant="ghost" className="rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors h-8 w-8" onClick={() => onMessage?.(friend)}>
                        <MessageSquare className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </Card>
    );
}
