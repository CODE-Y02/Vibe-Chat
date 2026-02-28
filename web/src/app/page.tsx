"use client";

import { Button } from '@/components/ui/button';
import { Video, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tighter">VibeChat</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <Link href="/login">
              <Button variant="ghost" className="hover:bg-white/5 text-white">Login</Button>
            </Link>
            <Link href="/login">
              <Button className="rounded-full px-6 bg-white text-black hover:bg-white/90">Join Now</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-60 lg:pb-40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-40 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-[140px]" />
        </div>

        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Next-Gen Connection</span>
          </div>

          <h1 className="text-7xl lg:text-[10rem] font-black tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100 leading-[0.8] uppercase">
            Connect.<br />
            <span className="text-primary italic relative">
              Vibe.
              <span className="absolute -bottom-2 left-0 w-full h-2 bg-primary/30 blur-sm rounded-full"></span>
            </span><br />
            Live.
          </h1>

          <p className="text-2xl text-white/60 max-w-2xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 leading-relaxed font-light">
            Experience the next evolution of human connection. <span className="text-white font-medium">Anonymous, encrypted, and instant.</span> No borders, just pure conversation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <Link href="/login">
              <Button size="lg" className="rounded-full px-16 h-20 font-black text-xl bg-primary hover:bg-primary/90 shadow-[0_0_50px_rgba(var(--primary),0.3)] group transition-all hover:scale-105 active:scale-95">
                START VIBING <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
