"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, LayoutGrid, Users, Video, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSession } from "@/components/layout/SessionProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
    { href: "/feed", label: "Feed", icon: LayoutGrid },
    { href: "/chat", label: "Vibe", icon: Video, primary: true },
    { href: "/dms", label: "Chats", icon: MessageSquare },
    { href: "/friends", label: "Friends", icon: Users },
];

export function MobileNav() {
    const pathname = usePathname();
    const { data: session } = useSession();

    if (!session || pathname === "/chat") return null;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 pt-2 pointer-events-none">
            <motion.nav 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="glass border border-white/10 rounded-[2.5rem] h-20 flex items-center justify-around px-2 pointer-events-auto shadow-glow-lg"
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
                                    className="bg-primary p-5 rounded-[2rem] shadow-glow-lg border-4 border-[#020202]"
                                >
                                    <Icon className="w-7 h-7 text-white" />
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
                                    isActive ? "text-primary bg-primary/10" : "text-white/40 group-hover:text-white"
                                )}
                            >
                                <Icon className={cn("w-6 h-6", isActive && "fill-current")} />
                            </motion.div>
                            <span className={cn(
                                "text-[8px] font-black uppercase tracking-widest leading-none",
                                isActive ? "text-primary" : "text-white/20"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}

                <Link href="/profile" className="flex flex-col items-center gap-1 group">
                    <motion.div
                        whileTap={{ scale: 0.9 }}
                        className={cn(
                            "p-0.5 rounded-full border-2 transition-all",
                            pathname === "/profile" ? "border-primary" : "border-transparent"
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
                        pathname === "/profile" ? "text-primary" : "text-white/20"
                    )}>
                        Profile
                    </span>
                </Link>
            </motion.nav>
        </div>
    );
}
