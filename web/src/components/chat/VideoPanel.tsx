"use client";

import { useEffect, useRef, memo } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { webrtc } from '@/lib/webrtc';
import { VideoOff, MicOff, Shield, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import { classifyImage, isNSFW, loadNSFWModel } from '@/lib/nsfwValidator';
import { sendAutoFlag } from '@/actions/moderation.actions';
import { useSession } from "@/components/layout/SessionProvider";

interface VideoPanelProps {
    isLocal?: boolean;
    className?: string;
    isMatched?: boolean;
}

export const VideoPanel = memo(({ isLocal, className, isMatched = false }: VideoPanelProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        let timeoutId: NodeJS.Timeout;

        if (isLocal) {
            if (videoRef.current) {
                webrtc.setupLocalStream(videoRef.current);
            }

            // Optimized Moderation Loop (Non-blocking)
            const checkModeration = async () => {
                if (!isMounted.current) return;
                
                if (videoRef.current && videoRef.current.readyState === 4) {
                    const runInference = async () => {
                        if (!isMounted.current) return;
                        try {
                            // Only load if needed, nsfwValidator handles the check
                            await loadNSFWModel();
                            const predictions = await classifyImage(videoRef.current!);
                            if (isNSFW(predictions)) {
                                console.warn("[Moderation] Content flagged locally.");
                                sendAutoFlag().catch(console.error);
                            }
                        } catch (e) { }
                        
                        // Wait 10 seconds between checks to reduce CPU load
                        if (isMounted.current) {
                            timeoutId = setTimeout(checkModeration, 10000);
                        }
                    };

                    // Yield to browser for smooth 60fps UI
                    if ('requestIdleCallback' in window) {
                        (window as any).requestIdleCallback(() => runInference(), { timeout: 3000 });
                    } else {
                        setTimeout(runInference, 100);
                    }
                } else {
                    if (isMounted.current) {
                        timeoutId = setTimeout(checkModeration, 1500);
                    }
                }
            };
            checkModeration();
        } else {
            if (isMatched) {
                webrtc.onRemoteStream((stream) => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                });
            } else {
                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                }
            }
        }

        return () => {
            isMounted.current = false;
            if (timeoutId) clearTimeout(timeoutId);
            // Don't nullify srcObject here as it might cause flickering on re-renders 
            // of the parent if the logic is slightly delayed.
        };
    }, [isLocal, isMatched]);

    return (
        <Card className={cn(
            "relative overflow-hidden bg-card aspect-[4/3] rounded-[32px] border border-border shadow-2xl transition-all",
            className
        )}>
            {!isLocal && !isMatched ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background mesh-gradient dark">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center"
                    >
                        <div className="w-20 h-20 rounded-[24px] bg-muted/30 border border-border/40 flex items-center justify-center mb-6 shadow-inner relative group">
                            <Radio className="w-8 h-8 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                            <div className="absolute inset-0 bg-primary/20 rounded-[24px] animate-ping opacity-20" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">Waiting for Vibe</p>
                    </motion.div>
                </div>
            ) : (
                <div className="w-full h-full relative">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted={isLocal}
                        className="w-full h-full object-cover"
                        style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }}
                    />

                    {/* Scanner Line Overlay */}
                    {!isLocal && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <motion.div
                                initial={{ translateY: "-10%" }}
                                whileInView={{ translateY: "300px" }}
                                viewport={{ once: false }}
                                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                className="absolute top-0 left-0 right-0 h-px bg-primary/20 shadow-[0_0_15px_rgba(243,75,59,0.5)] z-10"
                            />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
                        </div>
                    )}
                </div>
            )}

            {/* Premium Badges */}
            <div className="absolute top-6 left-6 flex items-center gap-3">
                <div className="glass px-4 py-2 rounded-xl flex items-center gap-2.5 border border-border/50 shadow-glow-sm">
                    <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isLocal ? "bg-primary animate-pulse" : (isMatched ? "bg-emerald-500" : "bg-white/20")
                    )} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/90">
                        {isLocal ? 'Local Stream' : 'Remote Vibe'}
                    </span>
                </div>

                {isMatched && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass px-4 py-2 rounded-xl flex items-center gap-2 border border-border/50 shadow-glow-sm bg-emerald-500/10"
                    >
                        <Shield className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">Encrypted</span>
                    </motion.div>
                )}
            </div>

            {/* Bottom Controls Indicator */}
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-3">
                    {/* Signal bars mockup */}
                    <div className="flex items-end gap-0.5 h-3 opacity-30">
                        <div className="w-1 h-1 bg-foreground rounded-full" />
                        <div className="w-1 h-2 bg-foreground rounded-full" />
                        <div className="w-1 h-3 bg-foreground rounded-full" />
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/30 italic">
                        Node: {isLocal ? "Edge-01" : "Peer-Direct"}
                    </span>
                </div>
            </div>
        </Card>
    );
});

VideoPanel.displayName = 'VideoPanel';

