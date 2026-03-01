"use client";

import { useInfiniteQuery } from '@tanstack/react-query';
import { getFeed } from '@/actions/feed.actions';
import { PostCard, Post } from './PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function FeedList() {
    const { ref, inView } = useInView();

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: ['feed'],
        queryFn: ({ pageParam }) => getFeed(pageParam),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage?.nextCursor,

        /**
         * SCALE RECOMMENDATION: "Stale-While-Revalidate" (SWR) Configuration
         * 
         * 1. staleTime: 30s - Data is considered fresh for 30s. No refetch during this window.
         * 2. gcTime: 5m - Keep unused data in memory for 5 mins before garbage collecting.
         * 3. refetchOnWindowFocus: true - Revalidate when user returns to tab (X behavior).
         * 4. refetchInterval: 60s - Background revalidation every minute.
         */
        staleTime: 30_000,
        gcTime: 1000 * 60 * 5,
        refetchOnWindowFocus: true,
        refetchInterval: 60_000,
    });

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (isLoading) {
        return (
            <div className="divide-y divide-white/5">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3 px-4 py-4">
                        <Skeleton className="w-10 h-10 rounded-full shrink-0 bg-white/5" />
                        <div className="flex-1 space-y-3">
                            <Skeleton className="h-3 w-32 bg-white/5" />
                            <Skeleton className="h-4 w-full bg-white/5" />
                            <Skeleton className="h-4 w-3/4 bg-white/5" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="py-10 text-center text-white/40">
                Failed to load feed. Please try again.
            </div>
        );
    }

    const posts = data?.pages.flatMap(page => page.data) || [];

    if (!posts.length) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-2xl mb-2">✨</p>
                <p className="text-white/40 text-sm font-medium">Nothing here yet — be the first to vibe!</p>
            </div>
        );
    }

    return (
        <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/20">
            <div className="divide-y divide-white/5">
                {posts.map((post: Post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>

            {/* Pagination trigger / loading indicator */}
            <div ref={ref} className="py-8 flex justify-center border-t border-white/5 bg-white/[0.01]">
                {isFetchingNextPage ? (
                    <div className="flex items-center gap-2 text-white/40 text-xs font-medium">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Loading more vibes...
                    </div>
                ) : hasNextPage ? (
                    <span className="text-white/10 text-[10px] uppercase font-bold tracking-widest">Scroll to load more</span>
                ) : (
                    <span className="text-white/20 text-[10px] uppercase font-bold tracking-widest">You've reached the end of the vibe</span>
                )}
            </div>
        </div>
    );
}
