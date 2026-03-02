"use server";

import { authenticatedFetch } from "@/lib/api-helper";

export async function reportUser(reportedId: string, reason: string) {
    try {
        const res = await authenticatedFetch("/moderation/report", {
            method: "POST",
            body: JSON.stringify({ reportedId, reason }),
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to send report");
        return { success: true };
    } catch (error) {
        return { error: "Failed to send report" };
    }
}

export async function blockUser(blockedId: string) {
    try {
        const res = await authenticatedFetch("/moderation/block", {
            method: "POST",
            body: JSON.stringify({ blockedId }),
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to block user");
        return { success: true };
    } catch (error) {
        return { error: "Failed to block user" };
    }
}

export async function sendAutoFlag() {
    try {
        const res = await authenticatedFetch("/moderation/flag", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to flag user");
        return await res.json();
    } catch (error) {
        return { error: "Failed to flag user" };
    }
}
