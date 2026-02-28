"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, LayoutGrid, Users, Video, Menu, Moon, Sun, LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileModal } from "./ProfileModal";

const navItems = [
    { href: "/dms", label: "Chats", icon: MessageSquare },
    { href: "/feed", label: "Feed", icon: LayoutGrid },
    { href: "/friends", label: "Friends", icon: Users },
];

export function Navbar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [open, setOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && document.documentElement.classList.contains('dark')) {
            setIsDark(true);
        }
    }, []);

    const toggleTheme = () => {
        document.documentElement.classList.toggle('dark');
        setIsDark(!isDark);
    };

    return (
        <header className="sticky top-0 z-40 w-full glass border-b border-border/50">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[240px] bg-background">
                            <div className="flex flex-col gap-6 py-6">
                                <div className="flex items-center gap-2">
                                    <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                                        <Video className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-xl">VibeChat</span>
                                </div>
                                <nav className="flex flex-col gap-2">
                                    {navItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                                                <span className={cn(
                                                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer font-medium",
                                                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                                                )}>
                                                    <Icon className="w-5 h-5" />
                                                    {item.label}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </div>
                        </SheetContent>
                    </Sheet>

                    <Link href="/">
                        <span className="flex items-center gap-2 cursor-pointer">
                            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm">
                                <Video className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-xl tracking-tight hidden sm:block">VibeChat</span>
                        </span>
                    </Link>
                </div>

                <nav className="hidden md:flex items-center gap-1 bg-muted/50 p-1 rounded-full border border-border/50">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href}>
                                <span className={cn(
                                    "flex items-center gap-2 px-4 py-1.5 rounded-full transition-all cursor-pointer font-medium text-sm",
                                    isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}>
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </Button>

                    {session?.user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                    <Avatar className="h-10 w-10 border border-border/50">
                                        <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                                        <AvatarFallback>{(session.user.name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 glass-card border-white/10 text-white" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-bold leading-none">{session.user.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {session.user.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer">
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="text-destructive cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Link href="/login">
                            <Button className="rounded-full">Sign In</Button>
                        </Link>
                    )}
                </div>
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
