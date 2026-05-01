"use client";

import { Button } from '@/components/ui/button';
import { Video, Sparkles, ArrowRight, Shield, Zap, Globe, MessageSquare, Heart, ShieldCheck, Fingerprint, Lock, Layers } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSession } from "@/components/layout/SessionProvider";
import { useRef } from 'react';

import Image from "next/image";

export function LandingClient({ initialSession }: { initialSession: any }) {
  const { data: session } = useSession();
  const effectiveSession = session || initialSession;
  const featuresRef = useRef(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as any } }
  };

  const features = [
    {
      icon: <Fingerprint className="w-8 h-8 text-primary" />,
      title: "Edge AI Moderation",
      description: "Our proprietary AI runs entirely in your browser. Sensitive content is flagged before it ever leaves your device."
    },
    {
      icon: <Lock className="w-8 h-8 text-emerald-400" />,
      title: "P2P Encryption",
      description: "Video streams are direct and end-to-end encrypted. No middleman, no recording, zero data retention."
    },
    {
      icon: <Heart className="w-8 h-8 text-pink-500" />,
      title: "Social Persistence",
      description: "Met someone cool? Add them as a friend to persist the vibe in the social feed and private DMs."
    },
    {
      icon: <Zap className="w-8 h-8 text-amber-400" />,
      title: "Atomic Matchmaking",
      description: "High-performance Redis logic ensures you're never waiting. Connect with the world in milliseconds."
    }
  ];

  return (
    <main>
      {/* Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-2xl opacity-50 will-change-transform" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-2xl opacity-50 will-change-transform" />
      </div>

      <section className="relative pt-32 pb-12 md:pt-48 lg:pt-64 lg:pb-32 flex flex-col items-center z-10 px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto text-center"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-full bg-muted/30 border border-border mb-8 md:mb-12 backdrop-blur-md shadow-inner"
          >
            <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary animate-pulse" />
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] opacity-60">The Future of Social Interaction</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-6xl sm:text-7xl md:text-9xl lg:text-[13rem] font-black tracking-[-0.06em] mb-8 md:mb-12 leading-[0.85] md:leading-[0.75] uppercase"
          >
            Match<span className="text-primary italic">.</span><br />
            Connect.<br />
            Vibe.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-base sm:text-xl md:text-3xl text-muted-foreground/60 max-w-sm sm:max-w-xl md:max-w-4xl mx-auto mb-12 md:mb-20 leading-tight font-medium tracking-tight"
          >
            Experience instant human connection in a privacy-first ecosystem. <span className="text-foreground">Encrypted, AI-moderated, and Borderless.</span>
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-10"
          >
            <Link href={effectiveSession ? "/chat" : "/login"} className="w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto rounded-[1.5rem] md:rounded-[2.5rem] px-8 md:px-20 h-20 md:h-28 font-black text-xl md:text-3xl bg-primary hover:bg-primary shadow-glow-lg transition-all group overflow-hidden relative border-none shimmer">
                  <span className="relative z-10 flex items-center justify-center gap-3 md:gap-6">
                    {effectiveSession ? "GO LIVE" : "START VIBING"}
                    <ArrowRight className="w-6 h-6 md:w-10 md:h-10 group-hover:translate-x-4 transition-transform duration-700" />
                  </span>
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Social Proof / Stats */}
          <motion.div
            variants={itemVariants}
            className="mt-20 md:mt-40 flex flex-wrap justify-center gap-8 md:gap-32 opacity-30 italic font-black text-sm md:text-2xl tracking-tighter text-muted-foreground"
          >
            <div>1.2M+ VIBES</div>
            <div>0 DATA LOGS</div>
            <div>GLOBAL NODES</div>
            <div>AI GUARDED</div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-32 relative z-10 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, idx) => (
              <motion.article
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
                className="p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-muted/20 border border-border hover:border-primary/20 transition-all hover:bg-muted/40 group shadow-2xl"
              >
                <div className="mb-6 md:mb-8 p-3 md:p-4 bg-muted/40 rounded-2xl md:rounded-3xl w-fit group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight mb-3 md:mb-4">{feature.title}</h3>
                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed font-medium">{feature.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section id="safety" className="py-24 md:py-48 relative overflow-hidden px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] aspect-square bg-primary/5 rounded-full blur-2xl opacity-50 -z-10 will-change-transform" />
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16 md:gap-24">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 space-y-6 md:space-y-10 order-2 lg:order-1"
            >
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Safety Protocol 1.0</span>
              </div>
              <h2 className="text-4xl md:text-6xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9] md:leading-none">
                Private by<br />
                <span className="text-emerald-400">Architecture.</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">
                We believe your face is your data. Unlike legacy platforms, VibeChat doesn't "cloud scan" your private video calls. Our AI identifies harmful content locally, on your device hardware, before a single byte reaches the network.
              </p>
              <ul className="space-y-3 md:space-y-4">
                {[
                  "Post-Quantum P2P Signaling",
                  "Zero Data Retention Policy",
                  "On-Device NSFW Filtering",
                  "Encrypted Metadata Handling"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 md:gap-4 text-[10px] md:text-sm font-black uppercase tracking-widest text-foreground/80">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex-1 relative order-1 lg:order-2 w-full max-w-sm md:max-w-none mx-auto lg:mx-0"
            >
              <div className="aspect-square rounded-[2rem] md:rounded-[4rem] bg-gradient-to-br from-primary/10 to-transparent border border-border p-8 md:p-12 relative overflow-hidden shadow-glow-lg">
                <Image 
                  src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2874&auto=format&fit=crop" 
                  alt="Safety Visualization"
                  fill
                  className="object-cover opacity-20 grayscale"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="relative h-full flex flex-col justify-center items-center text-center space-y-6 md:space-y-8">
                  <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center animate-pulse">
                    <Lock className="w-8 h-8 md:w-12 md:h-12 text-emerald-400" />
                  </div>
                  <div className="space-y-1 md:space-y-2">
                    <p className="text-2xl md:text-4xl font-black uppercase tracking-tighter">SECURED</p>
                    <p className="text-emerald-400 font-mono text-[8px] md:text-xs tracking-widest">CONNECTION STATUS: ANONYMOUS</p>
                  </div>
                </div>
                {/* Decorative scanner line */}
                <motion.div
                  animate={{ translateY: ['0%', '400px', '0%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="absolute top-0 left-0 right-0 h-1 bg-emerald-500/40 blur-sm z-20"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
