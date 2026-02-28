"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Vibe Crash!</h1>
                    <p className="text-white/40 font-medium">Something went wrong while catching the vibe. Don't worry, we're on it.</p>
                </div>
                <div className="flex gap-4 justify-center">
                    <Button
                        onClick={() => reset()}
                        className="rounded-full px-8 h-12 font-black gap-2 bg-primary hover:scale-105 transition-transform"
                    >
                        <RefreshCcw className="w-4 h-4" /> Try Again
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => window.location.href = "/"}
                        className="rounded-full px-8 h-12 text-white/60 hover:text-white"
                    >
                        Go Home
                    </Button>
                </div>
            </div>
        </div>
    );
}
