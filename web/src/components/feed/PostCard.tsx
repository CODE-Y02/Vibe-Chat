"use client";

import { reactToPost } from '@/actions/feed.actions';
import { toast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface Post {
    id: string;
    author: {
        id: string;
        username: string;
        avatar?: string;
    };
    content: string;
    likes: number;
    timestamp: number;
}

interface PostCardProps {
    post: Post;
}

export function PostCard({ post }: PostCardProps) {
    const handleLike = async () => {
        try {
            const res = await reactToPost(post.id, 'like');
            if (res.error) {
                toast({ title: res.error, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Failed to react', variant: 'destructive' });
        }
    };
    return (
        <Card className="p-5 rounded-2xl glass-card border-none bg-card/40 hover:bg-card/60 transition-colors duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border border-border/50 shadow-sm">
                        <AvatarImage src={post.author.avatar} />
                        <AvatarFallback>{post.author.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h4 className="font-semibold text-sm text-foreground leading-none mb-1">{post.author.username}</h4>
                        <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(post.timestamp, { addSuffix: true })}
                        </span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <MoreHorizontal className="w-4 h-4" />
                </Button>
            </div>

            <p className="text-foreground/90 text-sm leading-relaxed mb-6 whitespace-pre-wrap">{post.content}</p>

            <div className="flex items-center gap-4 text-muted-foreground">
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 hover:text-pink-500 hover:bg-pink-500/10 rounded-full h-8 px-3 transition-colors"
                    onClick={handleLike}
                >
                    <Heart className="w-4 h-4" />
                    <span className="text-xs font-medium">{post.likes}</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-2 hover:text-blue-500 hover:bg-blue-500/10 rounded-full h-8 px-3 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Reply</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto hover:text-foreground rounded-full transition-colors">
                    <Share2 className="w-4 h-4" />
                </Button>
            </div>
        </Card>
    );
}
