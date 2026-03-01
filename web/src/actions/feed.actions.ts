"use server";

import { authenticatedFetch } from "@/lib/api-helper";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const PostSchema = z.object({
    content: z.string().min(1).max(500),
});

export async function getFeed() {
    try {
        const res = await authenticatedFetch("/feed");
        if (!res.ok) throw new Error("Failed to fetch feed");
        return await res.json();
    } catch (error) {
        console.error("getFeed error:", error);
        return [];
    }
}

export async function createPost(content: string) {
    const validated = PostSchema.safeParse({ content });

    if (!validated.success) {
        return { error: "Invalid content" };
    }

    try {
        const res = await authenticatedFetch("/feed", {
            method: "POST",
            body: JSON.stringify(validated.data),
            headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();
        if (!res.ok) return { error: data.error ?? "Failed to create post" };

        revalidatePath("/feed");
        return { success: true };
    } catch (error) {
        console.error("createPost error:", error);
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
        return { success: true };
    } catch (error) {
        return { error: "Failed to react" };
    }
}
