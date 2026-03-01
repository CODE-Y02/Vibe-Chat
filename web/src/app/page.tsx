"use client";

import { Button } from '@/components/ui/button';
import { Video, Sparkles, ArrowRight, Shield, Zap, Globe } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Landing() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as any } }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-primary/30 font-sans overflow-x-hidden mesh-gradient">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/40 backdrop-blur-2xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="bg-primary p-2.5 rounded-2xl shadow-lg glow-sm"
            >
              <Video className="w-6 h-6 text-white" />
            </motion.div>
            <span className="text-2xl font-black tracking-tighter">VibeChat</span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-xs font-bold uppercase tracking-widest text-white/50">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <div className="h-4 w-px bg-white/10" />
            <Link href="/login">
              <Button variant="ghost" className="hover:bg-white/5 text-white px-6">Login</Button>
            </Link>
            <Link href="/login">
              <Button className="rounded-2xl px-8 bg-white text-black hover:bg-white/90 font-black shadow-xl transition-all hover:scale-105 active:scale-95">
                JOIN NOW
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-24 lg:pt-64 lg:pb-48 flex flex-col items-center overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-20 -left-20 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[160px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2]
            }}
            transition={{ duration: 12, repeat: Infinity, delay: 1 }}
            className="absolute bottom-40 -right-20 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[180px]"
          />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto px-6 text-center z-10"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/10 mb-10 backdrop-blur-md shadow-2xl"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Next-Gen Connection</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-7xl md:text-9xl lg:text-[11rem] font-black tracking-[-0.04em] mb-10 leading-[0.8] uppercase"
          >
            Connect.<br />
            <motion.span
              className="italic text-gradient relative inline-block group"
            >
              Vibe.
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1, delay: 1 }}
                className="absolute -bottom-2 left-0 h-3 bg-primary/20 blur-md rounded-full -z-10"
              />
            </motion.span><br />
            Live.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-2xl text-white/40 max-w-3xl mx-auto mb-20 leading-relaxed font-medium"
          >
            Experience the next evolution of human connection. <span className="text-white">Anonymous, encrypted, and instant.</span> No borders, just pure conversation.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-8"
          >
            <Link href="/login">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="rounded-[2rem] px-16 h-24 font-black text-2xl bg-primary hover:bg-primary shadow-glow-lg transition-all group overflow-hidden relative border-none shimmer">
                  <span className="relative z-10 flex items-center gap-4">
                    START VIBING <ArrowRight className="w-8 h-8 group-hover:translate-x-3 transition-transform duration-500" />
                  </span>
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            variants={itemVariants}
            className="mt-32 pt-20 border-t border-white/5 grid grid-cols-2 md:grid-cols-3 gap-12 opacity-30 grayscale hover:opacity-100 transition-all duration-700 hover:grayscale-0"
          >
            <div className="flex flex-col items-center gap-3">
              <Shield className="w-8 h-8" />
              <span className="text-[10px] font-black uppercase tracking-widest">Post-Quantum Cryptography</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Zap className="w-8 h-8" />
              <span className="text-[10px] font-black uppercase tracking-widest">Ultra-Low Latency</span>
            </div>
            <div className="flex flex-col items-center gap-3 hidden md:flex">
              <Globe className="w-8 h-8" />
              <span className="text-[10px] font-black uppercase tracking-widest">Global P2P Network</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <style jsx global>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

