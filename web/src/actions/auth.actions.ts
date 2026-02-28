"use server";

import { authenticatedFetch } from "@/lib/api-helper";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getProfile() {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        const res = await authenticatedFetch(`/api/users/${session.user.id}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        return null;
    }
}

export async function updateProfile(data: { username?: string; avatar?: string; bio?: string }) {
    try {
        const res = await authenticatedFetch("/api/users/profile", {
            method: "PUT",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error("Failed to update profile");

        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update profile" };
    }
}
