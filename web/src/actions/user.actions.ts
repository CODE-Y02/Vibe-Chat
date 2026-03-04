"use server";

import { authenticatedFetch } from "@/lib/api-helper";

export async function getMe() {
    try {
        const res = await authenticatedFetch("/users/me");
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function updateProfile(data: { username?: string; avatar?: string; bio?: string }) {
    try {
        const res = await authenticatedFetch("/users/profile", {
            method: "PUT",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json" },
        });
        const resData = await res.json();
        if (!res.ok) return { error: resData.error ?? "Failed to update profile" };
        return { success: true };
    } catch {
        return { error: "Failed to update profile" };
    }
}
