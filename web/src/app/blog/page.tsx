"use client";

import posts from "@/config/blog-posts.json";
import { Navbar } from "@/components/layout/Navbar";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Calendar, User, Tag } from "lucide-react";
import { formatTime } from "@/lib/utils";

export default function BlogIndex() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans">
      <Navbar />
      
      <main className="container mx-auto px-4 py-20 md:py-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20 md:mb-32"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Tag className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">The Vibe Dispatch</span>
          </div>
          <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black tracking-tighter uppercase leading-[0.8] mb-10">
            Social<br />
            <span className="italic text-primary">Insights.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Thoughts on security, the future of human discovery, and our mission to rebuild random social from the ground up.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {posts.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link href={`/blog/${post.slug}`} className="group">
                <article className="glass-card rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden border border-white/5 hover:border-primary/20 transition-all hover:bg-white/[0.03] flex flex-col h-full">
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 grayscale-[0.5] group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60" />
                  </div>
                  
                  <div className="p-8 md:p-12 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-6 mb-8 opacity-40 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <span className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {post.date}</span>
                        <span className="flex items-center gap-2"><User className="w-3 h-3" /> {post.author}</span>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-6 leading-tight group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-10 font-medium">
                        {post.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest group-hover:gap-6 transition-all underline decoration-primary underline-offset-8">
                      READ POST <ArrowRight className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </article>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="py-20 border-t border-border opacity-20 text-[10px] font-black uppercase tracking-widest text-center mt-32 text-muted-foreground">
        <p>© 2026 VibeChat / Insights for the future.</p>
      </footer>
    </div>
  );
}
