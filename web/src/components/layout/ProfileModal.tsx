"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile } from "@/actions/auth.actions";
import { toast } from "sonner";

interface ProfileModalProps {
    user: any;
    isOpen: boolean;
    onClose: () => void;
}

export function ProfileModal({ user, isOpen, onClose }: ProfileModalProps) {
    const [formData, setFormData] = useState({
        username: (user?.user_metadata?.full_name || user?.email) || user?.username || user?.name || "",
        avatar: user?.user_metadata?.avatar_url || user?.avatar || user?.image || "",
        bio: user?.bio || "",
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        const savePromise = updateProfile(formData).then(res => {
            setLoading(false);
            if (!res.success) throw new Error("Failed to update profile");
            onClose();
            return res;
        }).catch(err => {
            setLoading(false);
            throw err;
        });

        toast.promise(savePromise, {
            loading: "Updating profile...",
            success: "Profile updated successfully",
            error: (err) => err.message || "An error occurred"
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] glass-card border-border text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="w-24 h-24 border-2 border-primary/50 shadow-2xl">
                            <AvatarImage src={formData.avatar} />
                            <AvatarFallback className="bg-muted text-primary font-black uppercase">{formData.username.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <Input
                            value={formData.avatar}
                            onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                            placeholder="Avatar URL"
                            className="bg-muted border-border"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="username" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Username</Label>
                        <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="bg-muted border-border font-bold"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="bio" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Bio</Label>
                        <Input
                            id="bio"
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            className="bg-muted border-border font-bold"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90">
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
