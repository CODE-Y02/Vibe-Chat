"use server";

import { authenticatedFetch } from "@/lib/api-helper";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const PostSchema = z.object({ content: z.string().min(1).max(500) });

/** Get paginated feed (cursor-based) */
export async function getFeed(cursor?: string, limit = 20) {
    try {
        const url = `/feed?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`;
        const res = await authenticatedFetch(url);
        if (!res.ok) return { data: [], nextCursor: undefined };
        return await res.json();
    } catch {
        return { data: [], nextCursor: undefined };
    }
}

export async function createPost(content: string) {
    const validated = PostSchema.safeParse({ content });
    if (!validated.success) return { error: "Invalid content" };

    try {
        const res = await authenticatedFetch("/feed", {
            method: "POST",
            body: JSON.stringify({ content }),
            headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!res.ok) return { error: data.error ?? "Failed to create post" };
        revalidatePath("/feed");
        return { success: true };
    } catch {
        return { error: "Failed to create post" };
    }
}

/** Delete a post/reply/repost */
export async function deletePost(postId: string) {
    try {
        const res = await authenticatedFetch(`/feed/${postId}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) return { error: data.error ?? "Failed to delete" };
        revalidatePath("/feed");
        return { success: true };
    } catch {
        return { error: "Failed to delete" };
    }
}

export async function reactToPost(postId: string, type: string) {
    try {
        const res = await authenticatedFetch("/feed/react", {
            method: "POST",
            body: JSON.stringify({ postId, type }),
            headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!res.ok) return { error: data.error ?? "Failed to react" };
        revalidatePath("/feed");
        return { success: true, toggled: data.toggled };
    } catch {
        return { error: "Failed to react" };
    }
}

/** Get paginated replies (cursor-based) */
export async function getReplies(parentId: string, cursor?: string, limit = 20) {
    try {
        const url = `/feed/${parentId}/replies?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`;
        const res = await authenticatedFetch(url);
        if (!res.ok) return { data: [], nextCursor: undefined };
        return await res.json();
    } catch {
        return { data: [], nextCursor: undefined };
    }
}

export async function createReply(parentId: string, content: string) {
    const validated = PostSchema.safeParse({ content });
    if (!validated.success) return { error: "Invalid content" };

    try {
        const res = await authenticatedFetch(`/feed/${parentId}/reply`, {
            method: "POST",
            body: JSON.stringify({ content }),
            headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!res.ok) return { error: data.error ?? "Failed to reply" };
        revalidatePath("/feed");
        return { success: true, post: data };
    } catch {
        return { error: "Failed to reply" };
    }
}

/** Repost or quote post */
export async function repostPost(postId: string, content?: string) {
    try {
        const res = await authenticatedFetch(`/feed/${postId}/repost`, {
            method: "POST",
            body: JSON.stringify({ content }),
            headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!res.ok) return { error: data.error ?? "Failed to repost" };
        revalidatePath("/feed");
        return { success: true, toggled: data.toggled };
    } catch {
        return { error: "Failed to repost" };
    }
}

/** Undo repost */
export async function undoRepost(postId: string) {
    try {
        const res = await authenticatedFetch(`/feed/${postId}/repost`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) return { error: data.error ?? "Failed to undo repost" };
        revalidatePath("/feed");
        return { success: true };
    } catch {
        return { error: "Failed to undo repost" };
    }
}

export async function updatePost(postId: string, content: string) {
    const validated = PostSchema.safeParse({ content });
    if (!validated.success) return { error: "Invalid content" };

    try {
        const res = await authenticatedFetch(`/feed/${postId}`, {
            method: "PATCH",
            body: JSON.stringify({ content }),
            headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!res.ok) return { error: data.error ?? "Failed to update post" };
        revalidatePath("/feed");
        return { success: true };
    } catch {
        return { error: "Failed to update post" };
    }
}

export async function bookmarkPost(postId: string) {
    try {
        const res = await authenticatedFetch(`/feed/${postId}/bookmark`, { method: "POST" });
        if (!res.ok) return { error: "Failed to bookmark" };
        return { success: true };
    } catch {
        return { error: "Failed to bookmark" };
    }
}

export async function undoBookmark(postId: string) {
    try {
        const res = await authenticatedFetch(`/feed/${postId}/bookmark`, { method: "DELETE" });
        if (!res.ok) return { error: "Failed to remove bookmark" };
        return { success: true };
    } catch {
        return { error: "Failed to remove bookmark" };
    }
}
