"use client";

import { useState, useEffect } from 'react';
import { reactToPost, createReply, getReplies, repostPost, undoRepost } from '@/actions/feed.actions';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Share2, MoreHorizontal, Loader2, Repeat2, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';

// --- Types matching optimized unified Post model ---
export interface PostAuthor {
    id: string;
    username: string | null;
    avatar: string | null;
}

export interface Post {
    id: string;
    content: string | null;
    parentId: string | null;
    repostOfId: string | null;
    createdAt: string;
    authorId: string;
    author: PostAuthor;
    // We optimized this to only include current user's reaction for tiny payloads
    reactions: Array<{ type: string; userId: string }>;
    replies: Post[];
    repostOf?: Post | null;
    // We now use _count for totals - massive scalability win
    _count?: { replies: number; reposts: number; reactions: number };
}

// --- Helpers ---
function safeTimeAgo(dateStr: string) {
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'just now';
        return formatDistanceToNow(d, { addSuffix: true });
    } catch {
        return 'just now';
    }
}

// --- Quoted / embedded post preview ---
function QuotePost({ post }: { post: Post }) {
    return (
        <div className="mt-3 border border-white/10 rounded-xl p-3 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-2 mb-1">
                <Avatar className="w-5 h-5">
                    <AvatarImage src={post.author?.avatar ?? undefined} />
                    <AvatarFallback className="text-[8px] bg-white/10">
                        {(post.author?.username ?? 'U').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold text-white/80">{post.author?.username ?? 'Unknown'}</span>
                <span className="text-xs text-white/30">· {safeTimeAgo(post.createdAt)}</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed line-clamp-3">{post.content}</p>
        </div>
    );
}

// --- Single reply row ---
function ReplyCard({ post }: { post: Post }) {
    const totalReplies = post._count?.replies ?? 0;
    return (
        <div className="flex gap-3 py-3">
            <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={post.author?.avatar ?? undefined} />
                <AvatarFallback className="text-[10px] bg-white/10">
                    {(post.author?.username ?? 'U').slice(0, 2).toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white/90 truncate">
                        {post.author?.username ?? 'Unknown'}
                    </span>
                    <span className="text-xs text-white/30 shrink-0">{safeTimeAgo(post.createdAt)}</span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{post.content}</p>
                {totalReplies > 0 && (
                    <span className="text-[10px] text-primary/50 font-bold mt-1 block">
                        {totalReplies} {totalReplies === 1 ? 'REPLY' : 'REPLIES'} BELOW
                    </span>
                )}
            </div>
        </div>
    );
}

// --- Main PostCard ---
export function PostCard({ post }: { post: Post }) {
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    const myUserId = session?.user?.id;

    // Use optimized check for liked status
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post._count?.reactions ?? 0);

    // Sync state if post changes (e.g. from polling)
    useEffect(() => {
        setLiked(post.reactions?.some(r => r.userId === myUserId) ?? false);
        setLikeCount(post._count?.reactions ?? 0);
    }, [post, myUserId]);

    const [reposted, setReposted] = useState(false);
    const [repostCount, setRepostCount] = useState(post._count?.reposts ?? 0);

    const [showReplies, setShowReplies] = useState(false);
    const [replying, setReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    const [allReplies, setAllReplies] = useState<Post[]>(post.replies ?? []);
    const [loadingMore, setLoadingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
    const totalReplies = post._count?.replies ?? 0;

    const authorName = post.author?.username ?? 'Unknown';
    const isRepost = !!post.repostOfId;
    const isQuotePost = isRepost && !!post.content;

    const handleLike = async () => {
        const wasLiked = liked;
        setLiked(!wasLiked);
        setLikeCount(c => wasLiked ? c - 1 : c + 1);

        const res = await reactToPost(post.id, 'like');
        if (res.error) {
            setLiked(wasLiked);
            setLikeCount(c => wasLiked ? c + 1 : c - 1);
            toast({ title: res.error, variant: 'destructive' });
        }
    };

    const handleRepost = async () => {
        if (reposted) {
            const res = await undoRepost(post.id);
            if (!res.error) { setReposted(false); setRepostCount(c => c - 1); }
        } else {
            const res = await repostPost(post.id);
            if (!res.error) { setReposted(true); setRepostCount(c => c + 1); }
            else toast({ title: res.error, variant: 'destructive' });
        }
    };

    const handleToggleReplies = async () => {
        if (!showReplies && allReplies.length < totalReplies) {
            setLoadingMore(true);
            const res = await getReplies(post.id);
            setAllReplies(res.data);
            setNextCursor(res.nextCursor);
            setLoadingMore(false);
        }
        setShowReplies(v => !v);
    };

    const handleLoadMoreReplies = async () => {
        if (!nextCursor) return;
        setLoadingMore(true);
        const res = await getReplies(post.id, nextCursor);
        setAllReplies(prev => [...prev, ...res.data]);
        setNextCursor(res.nextCursor);
        setLoadingMore(false);
    };

    const handleSubmitReply = async () => {
        if (!replyContent.trim()) return;
        setSubmittingReply(true);
        const res = await createReply(post.id, replyContent.trim());
        setSubmittingReply(false);
        if (res.error) { toast({ title: res.error, variant: 'destructive' }); return; }
        if (res.post) setAllReplies(prev => [...prev, res.post as Post]);
        setReplyContent('');
        setReplying(false);
        setShowReplies(true);
        queryClient.invalidateQueries({ queryKey: ['feed'] });
    };

    return (
        <article className="border-b border-white/5 px-4 py-4 hover:bg-white/[0.02] transition-colors duration-150">
            {/* Repost label */}
            {isRepost && !isQuotePost && (
                <div className="flex items-center gap-2 text-xs text-white/30 font-medium mb-2 ml-10">
                    <Repeat2 className="w-3.5 h-3.5" />
                    <span>{authorName} reposted</span>
                </div>
            )}

            <div className="flex gap-3">
                <div className="flex flex-col items-center shrink-0">
                    <Avatar className="w-10 h-10 border border-white/10 shrink-0">
                        <AvatarImage src={post.author?.avatar ?? undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs uppercase">
                            {authorName.slice(0, 2)}
                        </AvatarFallback>
                    </Avatar>
                    {showReplies && allReplies.length > 0 && (
                        <div className="w-[1px] flex-1 bg-white/10 mt-2 mb-1" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <header className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                            <span className="font-bold text-[15px] text-white truncate">{authorName}</span>
                            <span className="text-white/30 text-xs truncate shrink-0">· {safeTimeAgo(post.createdAt)}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-white hover:bg-white/5 rounded-full -mr-2">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </header>

                    {post.content && (
                        <p className="text-[15px] text-white/90 leading-relaxed mb-1.5 break-words">{post.content}</p>
                    )}

                    {post.repostOf && <QuotePost post={post.repostOf} />}

                    <footer className="flex items-center justify-between max-w-md pt-1 text-white/30">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setReplying(v => !v); setShowReplies(true); }}
                            className="h-8 px-2 gap-2 hover:text-sky-400 hover:bg-sky-400/10 rounded-full transition-colors group"
                        >
                            <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            {totalReplies > 0 && <span className="text-xs font-medium">{totalReplies}</span>}
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRepost}
                            className={`h-8 px-2 gap-2 rounded-full transition-colors group ${reposted ? 'text-emerald-400' : 'hover:text-emerald-400 hover:bg-emerald-400/10'}`}
                        >
                            <Repeat2 className={`w-4 h-4 group-hover:scale-110 transition-transform ${reposted ? 'scale-110' : ''}`} />
                            {repostCount > 0 && <span className="text-xs font-medium">{repostCount}</span>}
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLike}
                            className={`h-8 px-2 gap-2 rounded-full transition-colors group ${liked ? 'text-pink-500' : 'hover:text-pink-500 hover:bg-pink-500/10'}`}
                        >
                            <Heart className={`w-4 h-4 group-hover:scale-110 transition-transform ${liked ? 'fill-current scale-110' : ''}`} />
                            {likeCount > 0 && <span className="text-xs font-medium">{likeCount}</span>}
                        </Button>

                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-sky-400 hover:bg-sky-400/10 rounded-full transition-colors">
                            <Bookmark className="w-4 h-4" />
                        </Button>

                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-sky-400 hover:bg-sky-400/10 rounded-full transition-colors">
                            <Share2 className="w-4 h-4" />
                        </Button>
                    </footer>

                    {replying && (
                        <div className="mt-3 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <Avatar className="w-8 h-8 shrink-0">
                                <AvatarImage src={session?.user?.image ?? undefined} />
                                <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold uppercase">
                                    {(session?.user?.name ?? 'U').slice(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <Textarea
                                    autoFocus
                                    placeholder={`Post your reply to ${authorName}`}
                                    className="resize-none bg-transparent border-none focus-visible:ring-0 p-0 text-sm placeholder:text-white/20 min-h-[60px]"
                                    value={replyContent}
                                    onChange={e => setReplyContent(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmitReply(); }}
                                />
                                <div className="flex justify-end gap-2 border-t border-white/5 pt-2">
                                    <Button variant="ghost" size="sm" onClick={() => setReplying(false)} className="rounded-full h-8 px-4 text-xs">Cancel</Button>
                                    <Button disabled={!replyContent.trim() || submittingReply} onClick={handleSubmitReply} size="sm" className="bg-primary hover:bg-primary/90 rounded-full h-8 px-4 font-bold text-xs uppercase tracking-tight">
                                        {submittingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Reply'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination for replies */}
            {showReplies && allReplies.length > 0 && (
                <div className="ml-10 mt-1 pl-4 border-l border-white/10 space-y-1">
                    {allReplies.map(reply => <ReplyCard key={reply.id} post={reply} />)}

                    <div className="flex items-center gap-4 pt-1">
                        {loadingMore ? (
                            <span className="text-[10px] text-white/20 flex items-center gap-1.5 font-bold tracking-widest uppercase py-2">
                                <Loader2 className="w-3 h-3 animate-spin text-primary" /> Loading more...
                            </span>
                        ) : nextCursor ? (
                            <button onClick={handleLoadMoreReplies} className="text-[10px] text-primary hover:text-primary/70 font-bold tracking-widest uppercase py-2 transition-colors">
                                Load more replies
                            </button>
                        ) : null}

                        <button onClick={() => setShowReplies(false)} className="text-[10px] text-white/20 hover:text-white/40 font-bold tracking-widest uppercase py-2 transition-colors">
                            Hide thread
                        </button>
                    </div>
                </div>
            )}
        </article>
    );
}
