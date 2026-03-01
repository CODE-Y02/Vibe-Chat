"use client";

import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { webrtc } from '@/lib/webrtc';
import { VideoOff, MicOff } from 'lucide-react';

interface VideoPanelProps {
    isLocal?: boolean;
    className?: string;
    isMatched?: boolean;
}

export function VideoPanel({ isLocal, className, isMatched = false }: VideoPanelProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (isLocal) {
            if (videoRef.current) {
                webrtc.setupLocalStream(videoRef.current);
            }
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
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [isLocal, isMatched]);

    return (
        <Card className={cn("relative overflow-hidden bg-black/90 aspect-[4/3] rounded-2xl border border-white/10 shadow-xl", className)}>
            {!isLocal && !isMatched ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 bg-gradient-to-br from-indigo-900/20 to-purple-900/20">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <VideoOff className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="font-medium tracking-wide">Waiting for stranger...</p>
                </div>
            ) : (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className="w-full h-full object-cover mirror"
                    style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }}
                />
            )}

            {/* Overlay badges */}
            <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 flex gap-1 md:gap-2">
                <div className="bg-black/50 backdrop-blur-md text-white text-[8px] md:text-xs px-2 md:px-3 py-0.5 md:py-1 rounded-full font-medium shadow-sm whitespace-nowrap">
                    {isLocal ? 'You' : 'Stranger'}
                </div>
                {isLocal && (
                    <div className="bg-red-500/80 backdrop-blur-md text-white p-1 md:p-1.5 rounded-full shadow-sm">
                        <MicOff className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                    </div>
                )}
            </div>
        </Card>
    );
}
