"use server";

import { authenticatedFetch } from "@/lib/api-helper";
import { revalidatePath } from "next/cache";

export async function getFriends() {
    try {
        const res = await authenticatedFetch("/friends");
        if (!res.ok) throw new Error("Failed to fetch friends");
        return await res.json();
    } catch (error) {
        return [];
    }
}

export async function getFriendRequests() {
    try {
        const res = await authenticatedFetch("/friends/requests");
        if (!res.ok) throw new Error("Failed to fetch requests");
        return await res.json();
    } catch (error) {
        return [];
    }
}

export async function sendFriendRequest(friendId: string) {
    try {
        const res = await authenticatedFetch("/friends/request", {
            method: "POST",
            body: JSON.stringify({ friendId }),
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            return { error: body?.error || "Failed to send request" };
        }
        revalidatePath("/friends");
        return { success: true };
    } catch (error) {
        return { error: "Network error. Please try again." };
    }
}

export async function acceptFriendRequest(userId: string) {
    try {
        const res = await authenticatedFetch("/friends/accept", {
            method: "POST",
            body: JSON.stringify({ userId }),
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            return { error: body?.error || "Failed to accept request" };
        }
        revalidatePath("/friends");
        revalidatePath("/dms");
        return { success: true };
    } catch (error) {
        return { error: "Network error. Please try again." };
    }
}

export async function rejectFriendRequest(userId: string) {
    try {
        const res = await authenticatedFetch("/friends/reject", {
            method: "POST",
            body: JSON.stringify({ userId }),
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            return { error: body?.error || "Failed to reject request" };
        }
        revalidatePath("/friends");
        return { success: true };
    } catch (error) {
        return { error: "Network error. Please try again." };
    }
}

export async function removeFriend(friendId: string) {
    try {
        const res = await authenticatedFetch("/friends/remove", {
            method: "POST",
            body: JSON.stringify({ friendId }),
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to remove friend");
        revalidatePath("/friends");
        return { success: true };
    } catch (error) {
        return { error: "Failed to remove friend" };
    }
}
