"use client";

import { useEffect, useRef, memo } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { webrtc } from '@/lib/webrtc';
import { Shield, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import { classifyImage, isNSFW, loadNSFWModel } from '@/lib/nsfwValidator';
import { sendAutoFlag } from '@/actions/moderation.actions';

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
        let timeoutId: any;

        const setup = async () => {
            if (!videoRef.current || !isMounted.current) return;

            if (isLocal) {
                // For local stream, always setup if mounted
                await webrtc.setupLocalStream(videoRef.current);
                
                // Moderation loop
                const checkModeration = async () => {
                    if (!isMounted.current || !videoRef.current) return;
                    
                    try {
                        if (videoRef.current.readyState === 4) {
                            await loadNSFWModel();
                            const predictions = await classifyImage(videoRef.current);
                            if (isNSFW(predictions)) {
                                console.warn("[Moderation] Content flagged locally.");
                                sendAutoFlag().catch(console.error);
                            }
                        }
                    } catch (e) {}

                    if (isMounted.current) {
                        timeoutId = setTimeout(checkModeration, 15000); // Check every 15s to save CPU
                    }
                };
                checkModeration();
            } else {
                // For remote stream, only setup if matched
                if (isMatched) {
                    webrtc.onRemoteStream((stream) => {
                        if (videoRef.current && isMounted.current) {
                            videoRef.current.srcObject = stream;
                        }
                    });
                } else {
                    videoRef.current.srcObject = null;
                }
            }
        };

        setup();

        return () => {
            isMounted.current = false;
            if (timeoutId) clearTimeout(timeoutId);
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
                    </motion.div>
                </div>
            ) : (
                <div className="w-full h-full relative bg-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted={isLocal}
                        className="w-full h-full object-cover transition-all duration-700"
                        style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }}
                    />

                    <div className="absolute top-6 left-6 flex items-center gap-3 z-20">
                        <div className="glass px-4 py-2 rounded-xl flex items-center gap-2.5 border border-border/50 shadow-glow-sm">
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isLocal ? "bg-primary animate-pulse" : (isMatched ? "bg-emerald-500" : "bg-white/20")
                            )} />
                        </div>

                        {isMatched && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="glass px-4 py-2 rounded-xl flex items-center border border-border/50 shadow-glow-sm bg-emerald-500/10"
                            >
                                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                            </motion.div>
                        )}
                    </div>

                    {!isLocal && !isMatched && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-3xl z-30">
                            <div className="relative">
                                <motion.div 
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 3 }}
                                    className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" 
                                />
                                <div className="w-16 h-16 rounded-full border-4 border-primary/30 flex items-center justify-center bg-card shadow-glow">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-3">
                    <div className="flex items-end gap-0.5 h-3 opacity-30">
                        <div className="w-1 h-1 bg-foreground rounded-full" />
                        <div className="w-1 h-2 bg-foreground rounded-full" />
                        <div className="w-1 h-3 bg-foreground rounded-full" />
                    </div>
                </div>
            </div>
        </Card>
    );
});

VideoPanel.displayName = 'VideoPanel';
