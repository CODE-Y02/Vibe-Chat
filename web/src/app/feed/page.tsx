"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { FeedList } from '@/components/feed/FeedList';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, Send, Loader2, Share2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { createPost } from '@/actions/feed.actions';
import { useSession } from "@/components/layout/SessionProvider";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function FeedPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);
    const [content, setContent] = useState('');
    const queryClient = useQueryClient();

    const postMutation = useMutation({
        mutationFn: (text: string) => createPost(text),
        onSuccess: (res) => {
            if (res.error) {
                toast({ variant: 'destructive', description: res.error });
            } else {
                setContent('');
                toast({ description: 'Posted successfully' });
                queryClient.invalidateQueries({ queryKey: ['feed'] });
            }
        },
        onError: () => {
            toast({ variant: 'destructive', description: 'Failed to post' });
        }
    });

    const handlePost = () => {
        if (!content.trim()) return;
        postMutation.mutate(content.trim());
    };

    const user = session?.user;

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="mb-8 p-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter mb-2 bg-gradient-to-br from-foreground to-foreground/40 bg-clip-text text-transparent">Vibe Feed</h1>
                        <p className="text-muted-foreground font-semibold tracking-wide border-l-4 border-primary pl-4">Catch the latest energy from the community</p>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                            const url = `${window.location.origin}/profile/${user?.id || ''}`;
                            if (navigator.share) {
                                navigator.share({ title: 'Add me on VibeChat', text: 'Catch my vibe!', url }).catch(() => {});
                            } else {
                                navigator.clipboard.writeText(url);
                                toast({ title: 'Profile link copied!' });
                            }
                        }}
                        className="hidden md:flex items-center gap-2 rounded-full border-primary/20 hover:bg-primary/10 transition-colors shadow-sm"
                    >
                        <Share2 className="w-4 h-4 text-primary" />
                        <span className="font-bold text-sm">Share Profile</span>
                    </Button>
                </div>

                <Card className="p-4 sm:p-6 md:p-8 mb-12 glass-card border border-border shadow-2xl rounded-[1.5rem] md:rounded-[2.5rem] bg-card/50 backdrop-blur-xl">
                    <div className="flex gap-3 sm:gap-5">
                        <Avatar className="w-10 h-10 sm:w-14 sm:h-14 border-2 border-primary/20 shadow-2xl">
                            <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary font-black text-lg">{((user?.user_metadata?.full_name || user?.email) || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-6">
                            <Textarea
                                placeholder="What's the vibe today?"
                                className="resize-none min-h-[120px] border-none bg-transparent focus-visible:ring-0 px-2 py-4 text-xl font-medium placeholder:text-muted-foreground/30 text-foreground"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                            />
                            <div className="flex justify-between items-center border-t border-border pt-6">
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-[1.25rem] h-12 w-12 transition-all">
                                    <ImageIcon className="w-6 h-6" />
                                </Button>
                                <Button
                                    onClick={handlePost}
                                    disabled={!content.trim() || postMutation.isPending}
                                    className="rounded-[1.25rem] shadow-xl shadow-primary/25 font-black px-10 py-7 gap-3 hover:-translate-y-1 active:scale-95 transition-all bg-primary text-white"
                                >
                                    {postMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "VIBE IT"} <Send className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                <FeedList />
            </main>
        </div>
    );
}
