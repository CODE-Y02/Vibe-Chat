"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SessionProvider } from "@/components/layout/SessionProvider";
import { SocketManager } from "./SocketManager";
import { IncomingCallModal } from "../chat/IncomingCallModal";
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
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
            {...props}
        >
            <QueryClientProvider client={queryClient}>
                <SessionProvider>
                    <SocketManager>
                        {children}
                        <IncomingCallModal />
                    </SocketManager>
                </SessionProvider>
                <Toaster />
                <Sonner position="top-center" />
            </QueryClientProvider>
        </NextThemesProvider>
    );
}
