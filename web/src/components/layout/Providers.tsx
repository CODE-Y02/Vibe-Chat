"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react";
import { SocketManager } from "./SocketManager";
import { IncomingCallModal } from "../chat/IncomingCallModal";
import { SessionWatcher } from "./SessionWatcher";

export function Providers({ children, ...props }: ThemeProviderProps) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                retry: 1,
            },
        },
    }));

    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            {...props}
        >
            <QueryClientProvider client={queryClient}>
                <SessionProvider>
                    <SessionWatcher />
                    <SocketManager>
                        {children}
                        <IncomingCallModal />
                    </SocketManager>
                </SessionProvider>
                <Toaster />
            </QueryClientProvider>
        </NextThemesProvider>
    );
}
