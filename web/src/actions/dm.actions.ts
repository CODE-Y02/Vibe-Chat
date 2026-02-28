"use server";

import { authenticatedFetch } from "@/lib/api-helper";

export async function getConversations(page = 1, limit = 20) {
    try {
        const res = await authenticatedFetch(`/api/dm/conversations?page=${page}&limit=${limit}`);
        if (!res.ok) return { conversations: [], total: 0 };
        return await res.json();
    } catch (error) {
        return { conversations: [], total: 0 };
    }
}

export async function getMessages(userId: string, page = 1) {
    try {
        const res = await authenticatedFetch(`/api/dm/${userId}?page=${page}`);
        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        return [];
    }
}

export async function sendMessage(receiverId: string, content: string) {
    try {
        const res = await authenticatedFetch("/api/dm", {
            method: "POST",
            body: JSON.stringify({ receiverId, content }),
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to send message");
        return await res.json();
    } catch (error) {
        return { error: "Failed to send message" };
    }
}

export async function markAsRead(userId: string) {
    try {
        const res = await authenticatedFetch(`/api/dm/${userId}/read`, {
            method: "POST",
        });
        return res.ok;
    } catch (error) {
        return false;
    }
}

export async function getUnreadCount() {
    try {
        const res = await authenticatedFetch("/api/dm/unread");
        if (!res.ok) return 0;
        return await res.json();
    } catch (error) {
        return 0;
    }
}
