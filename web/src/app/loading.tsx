import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
            <div className="relative">
                <div className="w-24 h-24 border-t-2 border-primary rounded-full animate-spin opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            </div>
            <p className="mt-8 text-white/30 font-black uppercase tracking-[0.3em] text-xs animate-pulse">
                Catching the vibe...
            </p>
        </div>
    );
}
