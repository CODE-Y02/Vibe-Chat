"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, LayoutGrid, Users, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSession } from "@/components/layout/SessionProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileModal } from "./ProfileModal";
import { useState } from "react";

const navItems = [
    { href: "/feed", label: "Feed", icon: LayoutGrid },
    { href: "/chat", label: "Vibe", icon: Video, primary: true },
    { href: "/dms", label: "Chats", icon: MessageSquare },
    { href: "/friends", label: "Friends", icon: Users },
];

export function MobileNav() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [profileOpen, setProfileOpen] = useState(false);

    const isCoreRoute = ["/feed", "/dms", "/friends"].some(r => pathname === r) || pathname.startsWith("/chat");
    // Actually /chat has its own UI usually. Let's exclude it.
    const showNav = ["/feed", "/dms", "/friends", "/profile"].some(r => pathname === r || pathname.startsWith(r));

    if (!session || !showNav) return null;

    return (
        <>
            {/* ── Bottom Tab Bar ── */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 pt-2 pointer-events-none">
                <motion.nav
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="glass border border-border/60 rounded-[2.5rem] h-20 flex items-center justify-around px-2 pointer-events-auto shadow-xl"
                >
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        if (item.primary) {
                            return (
                                <Link key={item.href} href={item.href} className="relative -top-8">
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="bg-primary p-5 rounded-[2rem] shadow-glow-lg border-4 border-background"
                                    >
                                        <Icon className="w-7 h-7 text-primary-foreground" />
                                    </motion.div>
                                </Link>
                            );
                        }

                        return (
                            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 group">
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className={cn(
                                        "p-2 rounded-2xl transition-all",
                                        isActive ? "text-primary bg-primary/10" : "text-foreground/30 group-hover:text-foreground"
                                    )}
                                >
                                    <Icon className={cn("w-6 h-6", isActive && "fill-current")} />
                                </motion.div>
                                <span className={cn(
                                    "text-[8px] font-black uppercase tracking-widest leading-none",
                                    isActive ? "text-primary" : "text-foreground/20"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Profile button — opens modal, no logout risk */}
                    <button
                        onClick={() => setProfileOpen(true)}
                        className="flex flex-col items-center gap-1 group"
                    >
                        <motion.div
                            whileTap={{ scale: 0.9 }}
                            className={cn(
                                "p-0.5 rounded-full border-2 transition-all",
                                profileOpen ? "border-primary" : "border-transparent"
                            )}
                        >
                            <Avatar className="h-7 w-7">
                                <AvatarImage src={session.user?.user_metadata?.avatar_url || ""} />
                                <AvatarFallback className="bg-primary/20 text-primary text-[8px] font-black uppercase">
                                    {((session.user?.user_metadata?.full_name || session.user?.email) || "U").slice(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                        </motion.div>
                        <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest leading-none",
                            profileOpen ? "text-primary" : "text-foreground/20"
                        )}>
                            Me
                        </span>
                    </button>
                </motion.nav>
            </div>

            {session?.user && (
                <ProfileModal
                    user={session.user}
                    isOpen={profileOpen}
                    onClose={() => setProfileOpen(false)}
                />
            )}
        </>
    );
}
