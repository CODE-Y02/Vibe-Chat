"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/components/layout/SessionProvider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Video, ArrowRight, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

const siteItems = [
    { href: "/#features", label: "Features" },
    { href: "/#safety", label: "Safety" },
    { href: "/blog", label: "Blog" },
];

export function PublicNavbar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const isLanding = pathname === "/";

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    if (!mounted) return null;

    return (
        <nav className={cn(
            "fixed top-0 w-full z-50 border-b transition-all duration-300",
            isLanding ? "border-foreground/5 bg-background/40 backdrop-blur-2xl" : "border-border bg-background/80 backdrop-blur-xl"
        )}>
            <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                    <Link href="/" className="flex items-center gap-2 md:gap-3">
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="bg-primary p-2 rounded-xl md:rounded-2xl shadow-glow transition-all"
                        >
                            <Video className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </motion.div>
                        <span className="text-xl md:text-2xl font-black tracking-tighter uppercase italic text-foreground">
                            Vibe<span className="text-primary text-2xl md:text-3xl">.</span>
                        </span>
                    </Link>
                </div>

                <div className="hidden lg:flex items-center gap-8 px-6 py-2 rounded-2xl bg-muted/30 border border-border">
                    {siteItems.map((item) => (
                        <Link 
                            key={item.href} 
                            href={item.href} 
                            className={cn(
                                "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
                                pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-3 md:gap-6">
                    {session ? (
                        <Link href="/feed" className="flex items-center gap-2 md:gap-3 group">
                            <div className="text-right hidden sm:block">
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary leading-tight">Dashboard</p>
                                <p className="text-[10px] md:text-xs font-bold text-muted-foreground truncate max-w-[100px]">
                                    {session.user?.user_metadata?.full_name || session.user?.email}
                                </p>
                            </div>
                            <Avatar className="h-8 w-8 md:h-10 md:w-10 border border-border group-hover:border-primary/50 transition-colors shadow-glow-sm">
                                <AvatarImage src={session.user?.user_metadata?.avatar_url || ""} />
                                <AvatarFallback className="bg-primary/20 text-primary uppercase text-[8px] md:text-[10px] font-black">
                                    {((session.user?.user_metadata?.full_name || session.user?.email) || "U").slice(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                    ) : (
                        <Link href="/login">
                            <Button className="rounded-xl md:rounded-2xl px-4 md:px-8 h-10 md:h-12 bg-foreground text-background hover:bg-primary hover:text-white font-black shadow-xl transition-all group overflow-hidden relative border-none">
                                <span className="relative z-10 flex items-center gap-2 text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap">
                                    JOIN VIBE <ArrowRight className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Button>
                        </Link>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="rounded-full w-10 h-10 border border-border/50 hover:bg-muted/50 transition-colors"
                    >
                        {theme === "dark" ? (
                            <Sun className="w-4 h-4 text-orange-400" />
                        ) : (
                            <Moon className="w-4 h-4 text-slate-700" />
                        )}
                    </Button>
                </div>
            </div>
        </nav>
    );
}
