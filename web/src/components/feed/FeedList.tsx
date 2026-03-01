import { useQuery } from '@tanstack/react-query';
import { getFeed } from '@/actions/feed.actions';
import { PostCard, Post } from './PostCard';
import { Skeleton } from '@/components/ui/skeleton';

export function FeedList() {
    const { data: posts, isLoading } = useQuery<Post[]>({
        queryKey: ['feed'],
        queryFn: () => getFeed(),
        refetchInterval: 30_000, // poll every 30s for new posts
    });

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
                            <div className="flex gap-6 pt-1">
                                <Skeleton className="h-3 w-8 bg-white/5" />
                                <Skeleton className="h-3 w-8 bg-white/5" />
                                <Skeleton className="h-3 w-8 bg-white/5" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!posts?.length) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-2xl mb-2">✨</p>
                <p className="text-white/40 text-sm font-medium">Nothing here yet — be the first to vibe!</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-white/5 border border-white/5 rounded-2xl overflow-hidden">
            {posts.map((post: Post) => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    );
}
