"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { FeedList } from '@/components/feed/FeedList';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, Send, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { createPost } from '@/actions/feed.actions';
import { useSession } from 'next-auth/react';

export default function FeedPage() {
    const { data: session } = useSession();
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
        <div className="min-h-screen bg-[#050505] text-white">
            <Navbar />

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="mb-8 p-4">
                    <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">Vibe Feed</h1>
                    <p className="text-white/40 font-medium tracking-wide border-l-2 border-primary pl-4">Catch the latest energy from the community</p>
                </div>

                <Card className="p-6 mb-12 glass-card border border-white/5 shadow-2xl rounded-3xl bg-white/[0.02]">
                    <div className="flex gap-4">
                        <Avatar className="w-12 h-12 border border-white/10 shadow-xl">
                            <AvatarImage src={user?.image || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{user?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-4">
                            <Textarea
                                placeholder="What's the vibe today?"
                                className="resize-none min-h-[100px] border-none bg-transparent focus-visible:ring-0 px-0 text-lg placeholder:text-white/20"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                            />
                            <div className="flex justify-between items-center border-t border-white/5 pt-4">
                                <Button variant="ghost" size="icon" className="text-white/30 hover:text-primary hover:bg-primary/10 rounded-2xl h-10 w-10 transition-colors">
                                    <ImageIcon className="w-5 h-5" />
                                </Button>
                                <Button
                                    onClick={handlePost}
                                    disabled={!content.trim() || postMutation.isPending}
                                    className="rounded-2xl shadow-lg shadow-primary/20 font-black px-8 py-6 gap-2 hover:-translate-y-1 transition-all bg-primary"
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
