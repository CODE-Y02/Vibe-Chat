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
    reactions: Array<{ type: string; userId: string }>;
    replies: Post[];
    repostOf?: Post | null;
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

// ─── Quoted / embedded post preview ──────────────────────────────────────────
function QuotePost({ post }: { post: Post }) {
    if (!post) return null;
    return (
        <div className="mt-3 border border-white/10 rounded-xl p-3 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors overflow-hidden">
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
            {post.content && <p className="text-sm text-white/70 leading-relaxed line-clamp-3 break-words">{post.content}</p>}
        </div>
    );
}

// ─── Main PostCard ────────────────────────────────────────────────────────────
export function PostCard({ post, isReply = false, depth = 0 }: { post: Post; isReply?: boolean; depth?: number }) {
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    const myUserId = session?.user?.id;

    // Repost logic: if it's a pure repost, we show the ORIGINAL post's data but with a banner
    const isPureRepost = !!post.repostOfId && !post.content;
    const isQuotePost = !!post.repostOfId && !!post.content;
    const displayPost = isPureRepost && post.repostOf ? post.repostOf : post;
    const authorName = displayPost.author?.username ?? 'Unknown';

    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(displayPost._count?.reactions ?? 0);
    const [repostCount, setRepostCount] = useState(displayPost._count?.reposts ?? 0);
    const [reposted, setReposted] = useState(false);

    const [showReplies, setShowReplies] = useState(false);
    const [replying, setReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    const [allReplies, setAllReplies] = useState<Post[]>(post.replies ?? []);
    const [loadingMore, setLoadingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
    const totalReplies = displayPost._count?.replies ?? 0;

    useEffect(() => {
        setLiked(displayPost.reactions?.some(r => r.userId === myUserId) ?? false);
        setLikeCount(displayPost._count?.reactions ?? 0);
        setRepostCount(displayPost._count?.reposts ?? 0);
        // Special check: did I repost this?
        setReposted(false); // In a real app we'd fetch this or check a reaction type REPOST
    }, [displayPost, myUserId]);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const wasLiked = liked;
        setLiked(!wasLiked);
        setLikeCount(c => wasLiked ? c - 1 : c + 1);

        const res = await reactToPost(displayPost.id, 'like');
        if (res.error) {
            setLiked(wasLiked);
            setLikeCount(c => wasLiked ? c + 1 : c - 1);
            toast({ title: res.error, variant: 'destructive' });
        }
    };

    const handleRepost = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (reposted) {
            const res = await undoRepost(displayPost.id);
            if (!res.error) { setReposted(false); setRepostCount(c => c - 1); }
        } else {
            const res = await repostPost(displayPost.id);
            if (!res.error) { setReposted(true); setRepostCount(c => c + 1); }
            else toast({ title: res.error, variant: 'destructive' });
        }
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/post/${displayPost.id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Vibe from ${authorName}`,
                    text: displayPost.content || 'Check out this vibe!',
                    url: url
                });
            } catch (err) { }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                toast({ title: "Link copied!" });
            } catch (err) {
                toast({ title: "Failed to copy", variant: "destructive" });
            }
        }
    };

    const handleToggleReplies = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!showReplies && allReplies.length === 0 && totalReplies > 0) {
            setLoadingMore(true);
            const res = await getReplies(displayPost.id);
            setAllReplies(res.data);
            setNextCursor(res.nextCursor);
            setLoadingMore(false);
        }
        setShowReplies(v => !v);
    };

    const handleLoadMoreReplies = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!nextCursor) return;
        setLoadingMore(true);
        const res = await getReplies(displayPost.id, nextCursor);
        setAllReplies(prev => [...prev, ...res.data]);
        setNextCursor(res.nextCursor);
        setLoadingMore(false);
    };

    const handleSubmitReply = async () => {
        if (!replyContent.trim()) return;
        setSubmittingReply(true);
        const res = await createReply(displayPost.id, replyContent.trim());
        setSubmittingReply(false);
        if (res.error) { toast({ title: res.error, variant: 'destructive' }); return; }
        if (res.post) setAllReplies(prev => [res.post as Post, ...prev]);
        setReplyContent('');
        setReplying(false);
        setShowReplies(true);
        queryClient.invalidateQueries({ queryKey: ['feed'] });
    };

    return (
        <article className={`border-b border-white/5 transition-colors duration-150 ${depth > 0 ? '' : 'hover:bg-white/[0.01]'}`}>
            <div className={`px-4 py-3 ${depth > 0 ? 'pl-2' : ''}`}>
                {/* Repost banner - Exactly like X */}
                {isPureRepost && (
                    <div className="flex items-center gap-2 text-[13px] text-white/40 font-bold mb-1 ml-9">
                        <Repeat2 className="w-4 h-4" />
                        <span>{post.author?.id === myUserId ? 'You' : (post.author?.username ?? 'Someone')} reposted</span>
                    </div>
                )}

                <div className="flex gap-3">
                    <div className="flex flex-col items-center shrink-0">
                        <Avatar className={`${depth > 0 ? 'w-8 h-8' : 'w-10 h-10'} border border-white/10 shrink-0`}>
                            <AvatarImage src={displayPost.author?.avatar ?? undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs uppercase text-[10px]">
                                {authorName.slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        {((showReplies && allReplies.length > 0) || isReply) && (
                            <div className="w-[2px] flex-1 bg-white/5 mt-2 mb-1 rounded-full" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <header className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1 truncate text-[15px]">
                                <span className="font-bold text-white truncate hover:underline cursor-pointer">{authorName}</span>
                                <span className="text-white/30 truncate shrink-0">@{authorName.toLowerCase().replace(/\s/g, '')}</span>
                                <span className="text-white/30 shrink-0">· {safeTimeAgo(displayPost.createdAt)}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-sky-400 hover:bg-sky-400/10 rounded-full -mr-2 transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </header>

                        {displayPost.content && (
                            <p className={`${depth > 0 ? 'text-[14px]' : 'text-[15px]'} text-white/90 leading-normal mb-2 break-words`}>
                                {displayPost.content}
                            </p>
                        )}

                        {isQuotePost && post.repostOf && <QuotePost post={post.repostOf} />}

                        <footer className="flex items-center justify-between max-w-sm pt-1 text-white/40">
                            <Button
                                variant="ghost" size="sm"
                                onClick={(e) => { e.stopPropagation(); setReplying(v => !v); setShowReplies(true); }}
                                className="h-8 px-2 gap-2 hover:text-sky-400 hover:bg-sky-400/10 rounded-full transition-colors group"
                            >
                                <MessageCircle className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
                                {totalReplies > 0 && <span className="text-xs">{totalReplies}</span>}
                            </Button>

                            <Button
                                variant="ghost" size="sm"
                                onClick={handleRepost}
                                className={`h-8 px-2 gap-2 rounded-full transition-colors group ${reposted ? 'text-emerald-500' : 'hover:text-emerald-500 hover:bg-emerald-500/10'}`}
                            >
                                <Repeat2 className={`w-4.5 h-4.5 group-hover:scale-110 transition-transform ${reposted ? 'scale-110' : ''}`} />
                                {repostCount > 0 && <span className="text-xs">{repostCount}</span>}
                            </Button>

                            <Button
                                variant="ghost" size="sm"
                                onClick={handleLike}
                                className={`h-8 px-2 gap-2 rounded-full transition-colors group ${liked ? 'text-pink-600' : 'hover:text-pink-600 hover:bg-pink-600/10'}`}
                            >
                                <Heart className={`w-4.5 h-4.5 group-hover:scale-110 transition-transform ${liked ? 'fill-current scale-110' : ''}`} />
                                {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
                            </Button>

                            <Button
                                variant="ghost" size="icon"
                                onClick={handleShare}
                                className="h-8 w-8 hover:text-sky-400 hover:bg-sky-400/10 rounded-full transition-colors"
                            >
                                <Share2 className="w-4.5 h-4.5" />
                            </Button>
                        </footer>

                        {replying && (
                            <div className="mt-3 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Avatar className="w-8 h-8 shrink-0">
                                    <AvatarImage src={session?.user?.image ?? undefined} />
                                    <AvatarFallback className="bg-primary text-white text-[10px] font-bold">
                                        {(session?.user?.name ?? 'U').slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <Textarea
                                        autoFocus
                                        placeholder={`Reply to ${authorName}...`}
                                        className="resize-none bg-transparent border-none focus-visible:ring-0 p-0 text-md placeholder:text-white/20 min-h-[80px]"
                                        value={replyContent}
                                        onChange={e => setReplyContent(e.target.value)}
                                    />
                                    <div className="flex justify-end gap-2 border-t border-white/5 pt-3">
                                        <Button variant="ghost" size="sm" onClick={() => setReplying(false)} className="rounded-full h-8 px-4 text-xs font-bold">Cancel</Button>
                                        <Button disabled={!replyContent.trim() || submittingReply} onClick={handleSubmitReply} size="sm" className="bg-primary hover:bg-primary/90 rounded-full h-8 px-6 font-bold text-xs uppercase shadow-lg shadow-primary/20">
                                            {submittingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Reply'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {totalReplies > 0 && !showReplies && (
                            <button onClick={handleToggleReplies}
                                className="text-[14px] text-primary/80 hover:text-primary mt-3 font-semibold transition-colors block">
                                {loadingMore ? 'Loading threads...' : `Show all ${totalReplies} replies`}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Pagination for replies - Recursive call */}
            {showReplies && allReplies.length > 0 && (
                <div className="ml-9 border-l border-white/5">
                    <div className="divide-y divide-white/5">
                        {allReplies.map(reply => (
                            <PostCard key={reply.id} post={reply} isReply={true} depth={depth + 1} />
                        ))}
                    </div>

                    <div className="flex items-center gap-4 px-4 py-3">
                        {loadingMore ? (
                            <span className="text-[10px] text-white/20 flex items-center gap-2 font-black tracking-widest uppercase">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading...
                            </span>
                        ) : nextCursor ? (
                            <button onClick={handleLoadMoreReplies} className="text-[11px] text-primary hover:text-primary/70 font-black tracking-widest uppercase transition-colors">
                                Show more vibes
                            </button>
                        ) : null}

                        <button onClick={() => setShowReplies(false)} className="text-[11px] text-white/20 hover:text-white/50 font-black tracking-widest uppercase ml-auto transition-colors">
                            Hide thread
                        </button>
                    </div>
                </div>
            )}
        </article>
    );
}
