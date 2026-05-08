"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useChatStore } from "@/store/useChatStore";
import { useSocket } from "@/hooks/use-socket";
import { VideoPanel } from "@/components/chat/VideoPanel";
import { ChatBox } from "@/components/chat/ChatBox";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Eye,
  Sparkles,
  X,
  Loader2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { webrtc } from "@/lib/webrtc";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { reportUser } from "@/actions/moderation.actions";

const radarVariants = {
  pulse: {
    scale: [1, 1.5, 2],
    opacity: [0.3, 0.1, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeOut" as any },
  },
};

export function StrangerVideoChat() {
  const session = useChatStore((state) => state.session);
  const isSearching = useChatStore((state) => state.isSearching);
  const setSearching = useChatStore((state) => state.setSearching);
  const disconnect = useChatStore((state) => state.disconnect);
  const setMatched = useChatStore((state) => state.setMatched);
  const addMessage = useChatStore((state) => state.addMessage);

  const { socket } = useSocket();
  const router = useRouter();

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isBlurred, setIsBlurred] = useState(true);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const retryInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleMatch = useCallback(
    (data: { peerId: string }) => {
      setMatched("anonymous-room", data.peerId, "Stranger", "");
      setIsBlurred(true);
      setIsChatMinimized(false);
      toast.success("Matched!", {
        description: "Say hello to your new vibe buddy.",
      });
    },
    [setMatched],
  );

  const handleStart = useCallback(() => {
    setSearching(true);
    setIsChatMinimized(false);
    socket.emit("joinQueue");
    toast.info("Searching...", { description: "Finding a vibe for you." });
  }, [setSearching, socket]);

  const handlePeerDisconnect = useCallback(() => {
    toast.info("Stranger disconnected", { description: "They left the vibe." });
    disconnect();
    webrtc.resetPeerConnection();
    setIsBlurred(true);
    setIsChatMinimized(false);
    handleStart();
  }, [disconnect, handleStart]);

  const handleSkip = useCallback(() => {
    if (session.strangerId) {
      socket.emit("skip", { peerId: session.strangerId });
    }
    disconnect();
    webrtc.resetPeerConnection();
    setIsBlurred(true);
    setIsChatMinimized(false);
    setSearching(true);
  }, [session.strangerId, socket, disconnect, setSearching]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("matched", handleMatch);
    socket.on("peerDisconnected", handlePeerDisconnect);
    socket.on("skip-cooldown", ({ remaining }: { remaining: number }) => {
      toast.error("Skip Cooldown", { description: `Wait ${remaining}s.` });
    });
    socket.on("match-failed", () => {
      // Backend confirmed a match but the peer's socket was already gone.
      // Stay in searching state — the retry interval will re-emit joinQueue.
      toast.info("Still searching...", {
        description: "Vibe buddy bounced, finding another.",
      });
    });

    return () => {
      socket.off("matched");
      socket.off("peerDisconnected");
      socket.off("skip-cooldown");
      socket.off("match-failed");
    };
  }, [socket, handleMatch, handlePeerDisconnect]);

  // Queue retry interval
  useEffect(() => {
    if (isSearching && !session.isMatched) {
      retryInterval.current = setInterval(() => {
        if (socket.connected) socket.emit("joinQueue");
      }, 5000);
    } else {
      if (retryInterval.current) clearInterval(retryInterval.current);
    }
    return () => {
      if (retryInterval.current) clearInterval(retryInterval.current);
    };
  }, [isSearching, session.isMatched, socket]);

  // Audio/Video toggle
  useEffect(() => {
    webrtc.toggleAudio(audioEnabled);
  }, [audioEnabled]);
  useEffect(() => {
    webrtc.toggleVideo(videoEnabled);
  }, [videoEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      webrtc.cleanup();
    };
  }, []);

  const handleClose = () => {
    if (session.strangerId) socket.emit("skip", { peerId: session.strangerId });
    else socket.emit("leaveQueue");
    disconnect();
    webrtc.cleanup();
    router.push("/dms");
  };

  const handleReport = async () => {
    if (session.strangerId) {
      reportUser(session.strangerId, "Inappropriate Behavior")
        .then(() => toast.success("User Reported"))
        .catch(console.error);
    }
    handleSkip();
  };

  const handleReveal = () => {
    if (session.strangerId) {
      webrtc.initiateOffer(session.strangerId);
      setIsBlurred(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background text-foreground transition-colors duration-300 relative overflow-hidden">
      {/* Header */}
      <header className="absolute top-6 inset-x-0 h-20 md:h-24 z-50 px-4 md:px-10 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="rounded-2xl glass h-12 w-12 md:h-14 md:w-14"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
        </div>

        <div className="pointer-events-auto">
          <Button
            onClick={
              isSearching
                ? () => {
                    socket.emit("leaveQueue");
                    disconnect();
                  }
                : handleSkip
            }
            disabled={isSearching && !session.isMatched}
            className="rounded-2xl px-6 md:px-10 h-12 md:h-14 font-black uppercase tracking-widest text-xs shadow-glow bg-primary"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {isSearching ? "Scanning" : "Skip"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
        {/* Full-screen remote video */}
        <div className="absolute inset-0 z-10 bg-black overflow-hidden">
          <VideoPanel
            isMatched={session.isMatched}
            className={cn(
              "w-full h-full border-none rounded-none aspect-auto shadow-none bg-transparent transition-all duration-1000",
              isBlurred && session.isMatched && "blur-2xl scale-110 opacity-40",
            )}
          />

          <AnimatePresence mode="wait">
            {/* START STATE */}
            {!session.isMatched && !isSearching && (
              <motion.div
                key="start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
              >
                <div className="pointer-events-auto flex flex-col items-center">
                  <h2 className="text-5xl md:text-8xl font-black mb-10 tracking-tighter uppercase italic text-white drop-shadow-2xl">
                    Vibe Check?
                  </h2>
                  <Button
                    size="lg"
                    onClick={handleStart}
                    className="rounded-full px-20 h-24 font-black text-2xl shadow-glow bg-primary"
                  >
                    START VIBING
                  </Button>
                </div>
              </motion.div>
            )}

            {/* SEARCHING STATE */}
            {isSearching && !session.isMatched && (
              <motion.div
                key="scan"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center z-30"
              >
                <div className="relative">
                  <motion.div
                    variants={radarVariants}
                    animate="pulse"
                    className="absolute inset-0 border-4 border-primary rounded-full"
                  />
                  <div className="w-40 h-40 md:w-48 md:h-48 bg-primary/10 rounded-full flex items-center justify-center border border-primary/30 backdrop-blur-3xl relative z-10">
                    <Zap className="w-10 h-10 text-primary animate-pulse" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* LOCKED IN (REVEAL) STATE */}
            {session.isMatched && isBlurred && (
              <motion.div
                key="reveal"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 flex items-center justify-center z-[60] px-6 pointer-events-auto"
              >
                <div className="glass-card p-12 rounded-[50px] text-center w-full max-w-sm shadow-glow-lg flex flex-col items-center bg-card/90 border-white/10">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-[24px] flex items-center justify-center mb-8 rotate-12">
                    <Sparkles className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-4xl font-black mb-3 uppercase italic tracking-tighter">
                    LOCKED IN
                  </h3>
                  <p className="text-sm text-muted-foreground/60 mb-8">
                    Ready to see your vibe match?
                  </p>
                  <Button
                    onClick={handleReveal}
                    className="w-full h-20 rounded-3xl font-black text-2xl bg-primary text-primary-foreground shadow-glow gap-3"
                  >
                    <Eye className="w-7 h-7" /> REVEAL
                  </Button>
                  <button
                    onClick={handleSkip}
                    className="mt-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-foreground transition-colors"
                  >
                    Skip this vibe
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PIP + ChatBox overlay */}
        <div className="absolute inset-0 z-40 pointer-events-none">
          {/* Local PIP */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "pointer-events-auto shrink-0 z-50 transition-all duration-500 absolute",
              "bg-black shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-3xl",
              // Desktop: Always Bottom-Left
              "md:bottom-12 md:left-12 md:w-72 lg:w-80 md:aspect-[4/3] md:rounded-[3rem]",
              // Mobile: Always Left, stacks above ChatBox ONLY when maximized
              "left-6 w-32 aspect-[3/4] rounded-[2rem] overflow-hidden",
              session.isMatched && !isBlurred
                ? isChatMinimized
                  ? "bottom-24" // Just above the minimized bar on mobile
                  : "bottom-[42vh] md:bottom-12" // Above the open chat
                : "bottom-12",
            )}
          >
            <VideoPanel
              isLocal
              isMatched={session.isMatched}
              className={cn(
                "w-full h-full border border-white/10 bg-black",
                !videoEnabled && "grayscale opacity-40",
              )}
            />

            {/* PREMIUM PIP CONTROLS */}
            <div className="absolute inset-x-0 bottom-4 px-4 flex justify-center gap-3 z-[60]">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-2xl transition-all shadow-xl border border-white/10",
                  audioEnabled
                    ? "bg-black/40 text-emerald-400"
                    : "bg-red-500/80 text-white border-red-500",
                )}
              >
                {audioEnabled ? (
                  <Mic className="w-4 h-4" />
                ) : (
                  <MicOff className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setVideoEnabled(!videoEnabled)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-2xl transition-all shadow-xl border border-white/10",
                  videoEnabled
                    ? "bg-black/40 text-emerald-400"
                    : "bg-red-500/80 text-white border-red-500",
                )}
              >
                {videoEnabled ? (
                  <VideoIcon className="w-4 h-4" />
                ) : (
                  <VideoOff className="w-4 h-4" />
                )}
              </button>
            </div>
          </motion.div>

          {/* ChatBox Container */}
          {session.isMatched && !isBlurred && (
            <div
              className={cn(
                "pointer-events-auto z-40 absolute transition-all duration-500",
                // Desktop: Bottom-Right
                "md:bottom-12 md:right-12",
                isChatMinimized
                  ? "bottom-8 right-6 w-64 h-14 md:w-80 md:h-16"
                  : "bottom-0 left-0 right-0 h-[40vh] max-h-[50vh] md:bottom-12 md:right-12 md:left-auto md:w-[460px] md:h-[650px]",
              )}
            >
              <ChatBox
                onReport={handleReport}
                isMinimized={isChatMinimized}
                onToggleMinimize={setIsChatMinimized}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
