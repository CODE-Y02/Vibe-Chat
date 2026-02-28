"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile } from "@/actions/auth.actions";
import { toast } from "@/hooks/use-toast";

interface ProfileModalProps {
    user: any;
    isOpen: boolean;
    onClose: () => void;
}

export function ProfileModal({ user, isOpen, onClose }: ProfileModalProps) {
    const [formData, setFormData] = useState({
        username: user?.name || user?.username || "",
        avatar: user?.image || user?.avatar || "",
        bio: user?.bio || "",
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await updateProfile(formData);
            if (res.success) {
                toast({ title: "Profile updated successfully" });
                onClose();
            } else {
                toast({ title: "Failed to update profile", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "An error occurred", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] glass-card border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="w-24 h-24 border-2 border-primary/50">
                            <AvatarImage src={formData.avatar} />
                            <AvatarFallback>{formData.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <Input
                            value={formData.avatar}
                            onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                            placeholder="Avatar URL"
                            className="bg-white/5 border-white/10"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="bg-white/5 border-white/10"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Input
                            id="bio"
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            className="bg-white/5 border-white/10"
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
