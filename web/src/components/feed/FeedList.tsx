import { useQuery } from '@tanstack/react-query';
import { getFeed } from '@/actions/feed.actions';
import { PostCard, Post } from './PostCard';
import { Skeleton } from '@/components/ui/skeleton';

export function FeedList() {
    const { data: posts, isLoading } = useQuery({
        queryKey: ['feed'],
        queryFn: () => getFeed()
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="p-5 rounded-2xl bg-card/30 border border-border/50 backdrop-blur-sm shadow-sm space-y-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-full bg-primary/10" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32 bg-primary/10" />
                                <Skeleton className="h-3 w-20 bg-primary/5" />
                            </div>
                        </div>
                        <Skeleton className="h-20 w-full bg-primary/5" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {posts?.map((post: Post) => (
                <PostCard
                    key={post.id}
                    post={post}
                />
            ))}
        </div>
    );
}
