"use client";

import { useState } from 'react';
import { reactToPost, createReply, getReplies, repostPost, undoRepost } from '@/actions/feed.actions';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Share2, MoreHorizontal, Loader2, Repeat2, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';

// ─── Types matching unified Post model ───────────────────────────────────────
export interface PostAuthor {
    id: string;
    username: string | null;
    avatar: string | null;
}

export interface Post {
    id: string;
    content: string | null;      // null for pure reposts
    parentId: string | null;     // set if this is a reply
    repostOfId: string | null;   // set if this is a repost
    createdAt: string;
    authorId: string;
    author: PostAuthor;
    reactions: Array<{ id: string; type: string; userId: string }>;
    replies: Post[];             // preview replies (same shape recursively)
    repostOf?: Post | null;      // embedded original post for quote/repost
    _count?: { replies: number; reposts: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── Single reply row (same unified Post shape) ───────────────────────────────
function ReplyCard({ post }: { post: Post }) {
    const replyCount = post._count?.replies ?? 0;
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
                    {replyCount > 0 && (
                        <span className="text-xs text-white/20 ml-auto shrink-0">{replyCount} repl{replyCount === 1 ? 'y' : 'ies'}</span>
                    )}
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{post.content}</p>
            </div>
        </div>
    );
}

// ─── Main PostCard ────────────────────────────────────────────────────────────
export function PostCard({ post }: { post: Post }) {
    const { data: session } = useSession();
    const queryClient = useQueryClient();

    const myUserId = session?.user?.id;
    const authorName = post.author?.username ?? 'Unknown';
    const isRepost = !!post.repostOfId;
    const isQuotePost = isRepost && !!post.content;

    const [liked, setLiked] = useState(
        post.reactions?.some(r => r.type === 'like' && r.userId === myUserId) ?? false
    );
    const [likeCount, setLikeCount] = useState(
        post.reactions?.filter(r => r.type === 'like').length ?? 0
    );
    const [reposted, setReposted] = useState(false);
    const [repostCount, setRepostCount] = useState(post._count?.reposts ?? 0);

    const [showReplies, setShowReplies] = useState(false);
    const [replying, setReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    const [allReplies, setAllReplies] = useState<Post[]>(post.replies ?? []);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const totalReplies = post._count?.replies ?? post.replies?.length ?? 0;

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
            const fetched = await getReplies(post.id, 1);
            setAllReplies(fetched);
            setPage(1);
            setLoadingMore(false);
        }
        setShowReplies(v => !v);
    };

    const handleLoadMore = async () => {
        setLoadingMore(true);
        const next = page + 1;
        const fetched = await getReplies(post.id, next);
        setAllReplies(prev => [...prev, ...fetched]);
        setPage(next);
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
            {/* Repost badge */}
            {isRepost && !isQuotePost && (
                <div className="flex items-center gap-2 text-xs text-white/30 font-medium mb-2 ml-12">
                    <Repeat2 className="w-3.5 h-3.5" />
                    <span>{authorName} reposted</span>
                </div>
            )}

            <div className="flex gap-3">
                {/* Avatar + thread line */}
                <div className="flex flex-col items-center shrink-0">
                    <Avatar className="w-10 h-10 border border-white/10">
                        <AvatarImage src={post.author?.avatar ?? undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                            {authorName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    {showReplies && allReplies.length > 0 && (
                        <div className="w-[2px] flex-1 bg-white/10 mt-2 rounded-full min-h-[24px]" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white">{authorName}</span>
                            <span className="text-white/30 text-xs">·</span>
                            <span className="text-white/30 text-xs">{safeTimeAgo(post.createdAt)}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-white/30 hover:text-white hover:bg-white/5 rounded-full -mr-1">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Content */}
                    {post.content && (
                        <p className="text-[15px] text-white/90 leading-relaxed mb-3 break-words">{post.content}</p>
                    )}

                    {/* Embedded original post (repost/quote) */}
                    {post.repostOf && <QuotePost post={post.repostOf} />}

                    {/* Action bar */}
                    <div className="flex items-center gap-1 -ml-2 mt-3 text-white/40">
                        {/* Reply */}
                        <Button
                            variant="ghost" size="sm"
                            onClick={() => { setReplying(v => !v); setShowReplies(true); }}
                            className="gap-1.5 hover:text-sky-400 hover:bg-sky-400/10 rounded-full h-8 px-2 text-xs font-medium transition-colors"
                        >
                            <MessageCircle className="w-4 h-4" />
                            {totalReplies > 0 && <span>{totalReplies}</span>}
                        </Button>

                        {/* Repost */}
                        <Button
                            variant="ghost" size="sm"
                            onClick={handleRepost}
                            className={`gap-1.5 rounded-full h-8 px-2 text-xs font-medium transition-colors ${reposted
                                ? 'text-emerald-400 hover:bg-emerald-400/10'
                                : 'hover:text-emerald-400 hover:bg-emerald-400/10'
                                }`}
                        >
                            <Repeat2 className="w-4 h-4" />
                            {repostCount > 0 && <span>{repostCount}</span>}
                        </Button>

                        {/* Like */}
                        <Button
                            variant="ghost" size="sm"
                            onClick={handleLike}
                            className={`gap-1.5 rounded-full h-8 px-2 text-xs font-medium transition-colors ${liked
                                ? 'text-pink-500 hover:bg-pink-500/10'
                                : 'hover:text-pink-500 hover:bg-pink-500/10'
                                }`}
                        >
                            <Heart className={`w-4 h-4 transition-transform ${liked ? 'fill-pink-500 scale-110' : ''}`} />
                            {likeCount > 0 && <span>{likeCount}</span>}
                        </Button>

                        {/* Bookmark / Share */}
                        <Button variant="ghost" size="icon" className="hover:text-sky-400 hover:bg-sky-400/10 rounded-full h-8 w-8 ml-auto transition-colors">
                            <Bookmark className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:text-sky-400 hover:bg-sky-400/10 rounded-full h-8 w-8 transition-colors">
                            <Share2 className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Reply composer */}
                    {replying && (
                        <div className="mt-3 flex gap-3 border-t border-white/5 pt-3">
                            <Avatar className="w-8 h-8 shrink-0">
                                <AvatarImage src={session?.user?.image ?? undefined} />
                                <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">
                                    {(session?.user?.name ?? 'U').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <Textarea
                                    autoFocus
                                    placeholder={`Reply to ${authorName}…`}
                                    className="resize-none bg-transparent border-none focus-visible:ring-0 p-0 text-sm text-white placeholder:text-white/30 min-h-[60px]"
                                    value={replyContent}
                                    onChange={e => setReplyContent(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmitReply(); }}
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs text-white/20">{replyContent.length}/500</span>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => setReplying(false)}
                                            className="text-white/40 hover:text-white rounded-full h-8 px-3 text-xs">Cancel</Button>
                                        <Button size="sm" disabled={!replyContent.trim() || submittingReply}
                                            onClick={handleSubmitReply}
                                            className="bg-primary hover:bg-primary/90 rounded-full h-8 px-4 font-bold text-xs">
                                            {submittingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Reply'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Show replies toggle */}
                    {totalReplies > 0 && !showReplies && (
                        <button onClick={handleToggleReplies}
                            className="text-xs text-primary/70 hover:text-primary mt-2 font-medium transition-colors">
                            {loadingMore ? 'Loading…' : `Show ${totalReplies} repl${totalReplies === 1 ? 'y' : 'ies'}`}
                        </button>
                    )}
                </div>
            </div>

            {/* Reply thread */}
            {showReplies && allReplies.length > 0 && (
                <div className="ml-[52px] border-l-2 border-white/5 pl-4 mt-1 divide-y divide-white/5">
                    {allReplies.map(reply => <ReplyCard key={reply.id} post={reply} />)}

                    {allReplies.length < totalReplies && (
                        <button onClick={handleLoadMore} disabled={loadingMore}
                            className="text-xs text-primary/70 hover:text-primary py-2 font-medium transition-colors flex items-center gap-1">
                            {loadingMore ? <><Loader2 className="w-3 h-3 animate-spin" /> Loading…</> : 'Load more replies'}
                        </button>
                    )}
                    <button onClick={() => setShowReplies(false)}
                        className="text-xs text-white/30 hover:text-white/60 py-2 font-medium transition-colors block">
                        Hide replies
                    </button>
                </div>
            )}
        </article>
    );
}
