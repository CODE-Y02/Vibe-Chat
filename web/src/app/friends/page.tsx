"use client";

import { Navbar } from '@/components/layout/Navbar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFriends, getFriendRequests, acceptFriendRequest, rejectFriendRequest } from '@/actions/friend.actions';
import { FriendCard } from '@/components/dms/FriendCard';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, Loader2 } from 'lucide-react';
import { useSession } from "@/components/layout/SessionProvider";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
                toast({ title: 'Friend Added!', description: 'You are now friends.', className: 'bg-green-500 text-white' });
                queryClient.invalidateQueries({ queryKey: ['friends'] });
                queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
            } else {
                toast({ title: data.error, variant: 'destructive' });
            }
        }
    });

    const rejectMutation = useMutation({
        mutationFn: rejectFriendRequest,
        onSuccess: (data) => {
            if (data.success) {
                toast({ title: 'Request Rejected' });
                queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
            } else {
                toast({ title: data.error, variant: 'destructive' });
            }
        }
    });

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8 pl-4 border-l-4 border-primary">
                    <h1 className="text-4xl font-black tracking-tighter mb-2">Friends</h1>
                    <p className="text-muted-foreground font-medium">Manage your connections and pending vibes</p>
                </div>

                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-muted rounded-2xl mb-10 border border-border">
                        <TabsTrigger value="all" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                            <Users className="w-4 h-4" /> All Friends
                        </TabsTrigger>
                        <TabsTrigger value="requests" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white relative">
                            <UserPlus className="w-4 h-4" />
                            Pending Requests
                            {requests && requests.length > 0 && (
                                <span className="bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold absolute -top-1 -right-1">
                                    {requests.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {isLoadingFriends ? (
                            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {friends?.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-20 col-span-full font-medium italic">No friends yet. Start connecting!</p>
                                ) : (
                                    friends?.map((friend: any) => (
                                        <FriendCard
                                            key={friend.id}
                                            friend={friend}
                                            type="friend"
                                        />
                                    ))
                                )}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="requests" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {isLoadingRequests ? (
                            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {requests?.length === 0 ? (
                                    <p className="text-white/30 text-center py-12 col-span-full">No pending requests</p>
                                ) : (
                                    requests?.map((req: any) => (
                                        <FriendCard
                                            key={req.id}
                                            friend={req}
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
