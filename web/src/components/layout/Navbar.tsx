"use client";

import { useTheme } from "next-themes";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "@/components/layout/SessionProvider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, LayoutGrid, Users, Video, Moon, Sun, LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileModal } from "./ProfileModal";
import { motion } from "framer-motion";

const navItems = [
    { href: "/dms", label: "Chats", icon: MessageSquare },
    { href: "/feed", label: "Feed", icon: LayoutGrid },
    { href: "/friends", label: "Friends", icon: Users },
];

import { useUnreadTracker } from "@/hooks/use-unread-tracker";
import { useFeedStore } from "@/store/useFeedStore";
import { useFriendStore } from "@/store/useFriendStore";
import { useDMStore } from "@/store/useDMStore";

export function Navbar({ className }: { className?: string }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [profileOpen, setProfileOpen] = useState(false);

    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const { toast } = useToast();

    const { hasNewPosts } = useFeedStore();
    const { hasNewRequests } = useFriendStore();
    const { totalUnreadCount } = useDMStore();

    // 🚀 Centralized Real-time Tracking (moved to custom hook)
    useUnreadTracker(toast);

    // Prevent hydration mismatch
    useEffect(() => setMounted(true), []);

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    if (!mounted) {
        return (
            <header className={cn("sticky top-0 z-50 w-full px-4 md:px-6 py-3 md:py-4 bg-background/80 backdrop-blur-xl", className)}>
                <div className="container mx-auto">
                    <div className="flex h-16 md:h-20 items-center justify-between px-5 md:px-8 glass border border-border/40 rounded-[24px] md:rounded-[32px]">
                        {/* Loading skeleton */}
                    </div>
                </div>
            </header>
        );
    }

    const isCurrentlyDark = theme === "dark";

    return (
        <header className={cn("sticky top-0 z-50 w-full px-4 md:px-6 py-3 md:py-4 bg-background/80 backdrop-blur-xl hidden md:block", className)}>
            <div className="container mx-auto">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex h-16 md:h-20 items-center justify-between px-5 md:px-8 glass border border-border/40 rounded-[24px] md:rounded-[32px] shadow-sm"
                >
                    <div className="flex items-center gap-6">
                        <Link href="/">
                            <motion.span
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-3 cursor-pointer group"
                            >
                                <div className="bg-primary p-2.5 rounded-2xl shadow-glow transition-all group-hover:rotate-6">
                                    <Video className="w-6 h-6 text-white" />
                                </div>
                                <span className="font-black text-2xl italic tracking-tighter text-foreground uppercase leading-none hidden sm:block">
                                    Vibe<span className="text-primary">Chat</span>
                                </span>
                            </motion.span>
                        </Link>
                    </div>

                    <nav className="hidden md:flex items-center gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            const isFeed = item.label === "Feed";
                            const isChats = item.label === "Chats";
                            const isFriends = item.label === "Friends";

                            return (
                                <Link key={item.href} href={item.href}>
                                    <div className="relative">
                                        <motion.span
                                            whileHover={{ y: -1 }}
                                            className={cn(
                                                "relative flex items-center gap-3 px-6 py-3 rounded-xl transition-all cursor-pointer font-black text-[10px] uppercase tracking-[0.2em] z-10",
                                                isActive ? "text-white" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {item.label}
                                            {isFeed && hasNewPosts && (
                                                <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] border border-white/20" />
                                            )}
                                            {isFriends && hasNewRequests && (
                                                <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] border border-white/20" />
                                            )}
                                            {isChats && totalUnreadCount > 0 && (
                                                <span className="absolute -top-1 right-2 inline-flex items-center justify-center min-w-4 h-4 px-1 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] border border-white/20 text-[9px] text-white font-black leading-none">
                                                    {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                                                </span>
                                            )}
                                        </motion.span>
                                        {isActive && (
                                            <motion.div
                                                layoutId="nav-pill"
                                                className="absolute inset-0 bg-primary rounded-xl shadow-glow-sm"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-4">
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-2xl h-12 w-12 bg-muted/30 border border-border text-muted-foreground hover:text-foreground">
                                {isCurrentlyDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </Button>
                        </motion.div>

                        {session?.user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        className="relative h-12 w-12 rounded-2xl overflow-hidden border border-white/10 p-0.5 shadow-glow-sm"
                                    >
                                        <Avatar className="h-full w-full rounded-[14px]">
                                            <AvatarImage src={session.user.user_metadata?.avatar_url || ""} alt={session.user.user_metadata?.full_name || session.user.email || ""} />
                                            <AvatarFallback className="bg-primary/20 text-primary font-black uppercase text-xs">{((session.user.user_metadata?.full_name || session.user.email) || "U").slice(0, 2)}</AvatarFallback>
                                        </Avatar>
                                    </motion.button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64 glass-card border-white/5 p-4 mt-4" align="end">
                                    <DropdownMenuLabel className="px-2 pb-4">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-black text-foreground uppercase tracking-wider">{session.user.user_metadata?.full_name || session.user.email}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground truncate">
                                                {session.user.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-border" />
                                    <DropdownMenuItem onClick={() => setProfileOpen(true)} className="rounded-xl px-4 py-3 cursor-pointer hover:bg-muted text-xs font-black uppercase tracking-widest text-muted-foreground focus:text-foreground transition-all">
                                        <UserIcon className="mr-3 h-4 w-4 text-primary" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border" />
                                    <DropdownMenuItem onClick={() => signOut()} className="rounded-xl px-4 py-3 cursor-pointer hover:bg-red-500/10 text-xs font-black uppercase tracking-widest text-red-400 focus:text-red-400 focus:bg-red-500/10 transition-all">
                                        <LogOut className="mr-3 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link href="/login">
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button className="rounded-2xl h-12 px-8 font-black uppercase tracking-[0.2em] text-xs shadow-glow bg-primary">
                                        Sign In
                                    </Button>
                                </motion.div>
                            </Link>
                        )}
                    </div>
                </motion.div>
            </div>

            {session?.user && (
                <ProfileModal
                    user={session.user}
                    isOpen={profileOpen}
                    onClose={() => setProfileOpen(false)}
                />
            )}
        </header>
    );
}

