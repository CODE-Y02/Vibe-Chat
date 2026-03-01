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
            <div className="divide-y divide-border">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3 px-4 py-4">
                        <Skeleton className="w-10 h-10 rounded-full shrink-0 bg-muted" />
                        <div className="flex-1 space-y-3">
                            <Skeleton className="h-3 w-32 bg-muted" />
                            <Skeleton className="h-4 w-full bg-muted" />
                            <Skeleton className="h-4 w-3/4 bg-muted" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="py-10 text-center text-muted-foreground">
                Failed to load feed. Please try again.
            </div>
        );
    }

    const posts = data?.pages.flatMap(page => page.data) || [];

    if (!posts.length) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-2xl mb-2">✨</p>
                <p className="text-muted-foreground text-sm font-medium">Nothing here yet — be the first to vibe!</p>
            </div>
        );
    }

    return (
        <div className="border border-border rounded-[2.5rem] overflow-hidden bg-card/30 backdrop-blur-3xl shadow-2xl">
            <div className="divide-y divide-border">
                {posts.map((post: Post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>

            {/* Pagination trigger / loading indicator */}
            <div ref={ref} className="py-10 flex justify-center border-t border-border bg-muted/30">
                {isFetchingNextPage ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-widest">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        Loading more vibes...
                    </div>
                ) : hasNextPage ? (
                    <span className="text-muted-foreground/30 text-[11px] uppercase font-black tracking-[0.2em]">Scroll to load more</span>
                ) : (
                    <span className="text-muted-foreground/50 text-[11px] uppercase font-black tracking-[0.2em] italic">You've reached the end of the vibe</span>
                )}
            </div>
        </div>
    );
}
