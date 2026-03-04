"use client";

import { Navbar } from '@/components/layout/Navbar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFriends, getFriendRequests, acceptFriendRequest, rejectFriendRequest } from '@/actions/friend.actions';
import { FriendCard } from '@/components/dms/FriendCard';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, Loader2 } from 'lucide-react';
import { useSession } from "@/components/layout/SessionProvider";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function FriendsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    const queryClient = useQueryClient();

    const { data: friends, isLoading: isLoadingFriends } = useQuery({
        queryKey: ['friends'],
        queryFn: getFriends
    });

    const { data: requests, isLoading: isLoadingRequests } = useQuery({
        queryKey: ['friend-requests'],
        queryFn: getFriendRequests
    });

    const acceptMutation = useMutation({
        mutationFn: acceptFriendRequest,
        onSuccess: (data) => {
            if (data.success) {
                toast.success('Friend Added!', { description: 'You are now friends.' });
                queryClient.invalidateQueries({ queryKey: ['friends'] });
                queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
            } else {
                toast.error(data.error);
            }
        }
    });

    const rejectMutation = useMutation({
        mutationFn: rejectFriendRequest,
        onSuccess: (data) => {
            if (data.success) {
                toast.success('Request Rejected');
                queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
            } else {
                toast.error(data.error);
            }
        }
    });

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden relative">
            {/* Background Mesh */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
            </div>

            <Navbar />

            <main className="container mx-auto px-6 py-12 lg:py-24 pb-32 md:pb-12 max-w-5xl relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 border border-border mb-6 backdrop-blur-md">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 text-primary">Your Network</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-[-0.05em] uppercase italic mb-4">
                        Connections<span className="text-primary">.</span>
                    </h1>
                    <p className="text-muted-foreground max-w-xl text-lg font-medium leading-relaxed uppercase tracking-tighter">
                        Manage your network, accept invitations, and keep the vibe alive across the globe.
                    </p>
                </motion.div>

                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="inline-flex h-14 items-center justify-start rounded-2xl bg-muted/40 p-1 border border-border mb-12 backdrop-blur-xl w-full md:w-auto">
                        <TabsTrigger value="all" className="rounded-xl px-8 h-full gap-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[10px] font-black uppercase tracking-widest transition-all">
                            <Users className="w-4 h-4" /> All Friends
                        </TabsTrigger>
                        <TabsTrigger value="requests" className="rounded-xl px-8 h-full gap-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[10px] font-black uppercase tracking-widest relative transition-all">
                            <UserPlus className="w-4 h-4" />
                            Requests
                            {requests && requests.length > 0 && (
                                <span className="bg-primary text-primary-foreground text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black absolute -top-1.5 -right-1.5 shadow-glow-sm">
                                    {requests.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
                        {isLoadingFriends ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-20">Synchronizing...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {friends?.length === 0 ? (
                                    <div className="py-40 text-center glass-card rounded-[3rem] border border-border">
                                        <div className="w-20 h-20 bg-muted/40 rounded-full flex items-center justify-center mx-auto mb-8 border border-border">
                                            <Users className="w-10 h-10 text-muted-foreground/30" />
                                        </div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight mb-2 opacity-40 italic">Ghost Town</h3>
                                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">Start matching to find your first vibe buddy.</p>
                                    </div>
                                ) : (
                                    friends?.map((friend: any) => (
                                        <FriendCard
                                            key={friend.id}
                                            friend={{ ...friend, status: friend.status || 'offline' }}
                                            type="friend"
                                            onMessage={(f) => router.push(`/dms?userId=${f.id}`)}
                                        />
                                    ))
                                )}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="requests" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
                        {isLoadingRequests ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-20">Fetching Invites...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {requests?.length === 0 ? (
                                    <div className="py-40 text-center glass-card rounded-[3rem] border border-border">
                                        <div className="w-20 h-20 bg-muted/40 rounded-full flex items-center justify-center mx-auto mb-8 border border-border">
                                            <UserPlus className="w-10 h-10 text-muted-foreground/30" />
                                        </div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight mb-2 opacity-40 italic">In-box empty</h3>
                                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">No pending friend requests at the moment.</p>
                                    </div>
                                ) : (
                                    requests?.map((req: any) => (
                                        <FriendCard
                                            key={req.id}
                                            friend={{ ...req, status: req.status || 'offline' }}
                                            type="request"
                                            onAccept={(id) => acceptMutation.mutate(id)}
                                            onReject={(id) => rejectMutation.mutate(id)}
                                        />
                                    ))
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
