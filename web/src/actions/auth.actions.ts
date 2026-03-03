"use server";

import { authenticatedFetch } from "@/lib/api-helper";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function getProfile() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return null;

    try {
        const res = await authenticatedFetch(`/users/me`);
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
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

        if (!res.ok) throw new Error("Failed to update profile");

        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update profile" };
    }
}
