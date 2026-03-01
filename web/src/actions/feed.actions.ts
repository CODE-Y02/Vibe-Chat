"use server";

import { authenticatedFetch } from "@/lib/api-helper";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const PostSchema = z.object({ content: z.string().min(1).max(500) });

export async function getFeed(page = 1) {
    try {
        const res = await authenticatedFetch(`/feed?page=${page}`);
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
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

/** Creates a reply (same Post model, parentId set) */
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

/** Get paginated replies for a post */
export async function getReplies(parentId: string, page = 1) {
    try {
        const res = await authenticatedFetch(`/feed/${parentId}/replies?page=${page}`);
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
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
        return { success: true };
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
