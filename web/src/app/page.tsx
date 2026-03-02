"use client";

import { Button } from '@/components/ui/button';
import { Video, Sparkles, ArrowRight, Shield, Zap, Globe, MessageSquare, Heart, ShieldCheck, Fingerprint, Lock, Layers } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRef } from 'react';

export default function Landing() {
  const { data: session } = useSession();
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
    <div className="min-h-screen bg-[#020202] text-white selection:bg-primary/30 font-sans overflow-x-hidden">
      {/* Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/40 backdrop-blur-2xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="bg-primary p-2.5 rounded-2xl shadow-glow transition-all"
            >
              <Video className="w-6 h-6 text-white" />
            </motion.div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">Vibe<span className="text-primary text-3xl">.</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8 px-6 py-2 rounded-2xl bg-white/[0.03] border border-white/5">
            <a href="#features" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors">Features</a>
            <a href="#safety" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors">Safety</a>
            <a href="#vision" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors">Vision</a>
          </div>

          <div className="flex items-center gap-6">
            {session ? (
              <Link href="/dms" className="flex items-center gap-3 group">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Connected</p>
                  <p className="text-xs font-bold text-white/60">{session.user?.name}</p>
                </div>
                <Avatar className="h-10 w-10 border border-white/10 group-hover:border-primary/50 transition-colors shadow-glow-sm">
                  <AvatarImage src={session.user?.image || ""} />
                  <AvatarFallback className="bg-primary/20 text-primary uppercase text-[10px] font-black">
                    {(session.user?.name || "U").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="rounded-2xl px-8 h-12 bg-white text-black hover:bg-primary hover:text-white font-black shadow-xl transition-all group overflow-hidden relative border-none">
                  <span className="relative z-10 flex items-center gap-2 text-xs uppercase tracking-widest">
                    JOIN THE VIBE <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-12 lg:pt-64 lg:pb-32 flex flex-col items-center z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto px-6 text-center"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.03] border border-white/10 mb-12 backdrop-blur-md shadow-inner"
          >
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">The Future of Social Interaction</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-7xl md:text-9xl lg:text-[13rem] font-black tracking-[-0.06em] mb-12 leading-[0.75] uppercase"
          >
            Match<span className="text-primary italic">.</span><br />
            Connect.<br />
            Vibe.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-3xl text-white/40 max-w-4xl mx-auto mb-20 leading-tight font-medium tracking-tight"
          >
            Experience instant human connection in a privacy-first ecosystem. <span className="text-white">Encrypted, AI-moderated, and Borderless.</span>
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-10"
          >
            <Link href={session ? "/chat" : "/login"}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="rounded-[2.5rem] px-20 h-28 font-black text-3xl bg-primary hover:bg-primary shadow-glow-lg transition-all group overflow-hidden relative border-none shimmer">
                  <span className="relative z-10 flex items-center gap-6">
                    {session ? "GO LIVE" : "START VIBING"}
                    <ArrowRight className="w-10 h-10 group-hover:translate-x-4 transition-transform duration-700" />
                  </span>
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Social Proof / Stats */}
          <motion.div
            variants={itemVariants}
            className="mt-40 flex flex-wrap justify-center gap-16 md:gap-32 opacity-30 italic font-black text-2xl tracking-tighter text-white/50"
          >
            <div>1.2M+ VIBES</div>
            <div>0 DATA LOGS</div>
            <div>GLOBAL NODES</div>
            <div>AI GUARDED</div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 relative z-10 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
                className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all hover:bg-white/[0.04] group shadow-2xl"
              >
                <div className="mb-8 p-4 bg-black/20 rounded-3xl w-fit group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-4">{feature.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed font-medium">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section id="safety" className="py-48 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[200px] -z-10" />
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-24">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 space-y-10"
            >
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Safety Protocol 1.0</span>
              </div>
              <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">
                Private by<br />
                <span className="text-emerald-400">Architecture.</span>
              </h2>
              <p className="text-xl text-white/40 leading-relaxed font-medium">
                We believe your face is your data. Unlike legacy platforms, VibeChat doesn't "cloud scan" your private video calls. Our AI identifies harmful content locally, on your device hardware, before a single byte reaches the network.
              </p>
              <ul className="space-y-4">
                {[
                  "Post-Quantum P2P Signaling",
                  "Zero Data Retention Policy",
                  "On-Device NSFW Filtering",
                  "Encrypted Metadata Handling"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-sm font-black uppercase tracking-widest text-white/80">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex-1 relative"
            >
              <div className="aspect-square rounded-[4rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 p-12 relative overflow-hidden shadow-glow-lg">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2874&auto=format&fit=crop')] bg-cover opacity-20 grayscale" />
                <div className="relative h-full flex flex-col justify-center items-center text-center space-y-8">
                  <div className="w-32 h-32 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center animate-pulse">
                    <Lock className="w-12 h-12 text-emerald-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-4xl font-black uppercase tracking-tighter">SECURED</p>
                    <p className="text-emerald-400 font-mono text-xs">CONNECTION STATUS: ANONYMOUS</p>
                  </div>
                </div>
                {/* Decorative scanner line */}
                <motion.div
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-0 right-0 h-1 bg-emerald-500/40 blur-sm z-20"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-48 border-t border-white/5 relative z-10 overflow-hidden">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-9xl font-black uppercase tracking-tighter mb-20">
            Ready to<br />
            <span className="text-gradient">Upgrade</span> your Social?
          </h2>
          <Link href="/login">
            <Button size="lg" className="rounded-full px-16 h-24 bg-white text-black hover:bg-primary hover:text-white transition-all text-xl font-black shadow-glow-lg">
              JOIN THE REVOLUTION
            </Button>
          </Link>
          <div className="mt-48 flex flex-col md:flex-row items-center justify-between gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
            <p>© 2026 CODE-Y02 / VibeChat. All rights reserved.</p>
            <div className="flex gap-10">
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <a href="#" className="hover:text-white transition-colors">Discord</a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .text-gradient {
          background: linear-gradient(to right, #ffffff, #ff3366, #ff8a00);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
}
