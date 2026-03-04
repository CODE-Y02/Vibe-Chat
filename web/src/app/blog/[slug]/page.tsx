"use client";

import posts from "@/config/blog-posts.json";
import { Navbar } from "@/components/layout/Navbar";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar, User, Tag } from "lucide-react";
import { useParams, notFound } from "next/navigation";

export default function BlogPost() {
  const { slug } = useParams();
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans">
      <Navbar />

      <main className="container mx-auto px-4 max-w-4xl py-24 md:py-48 relative z-10">
        <Link href="/blog" className="inline-flex items-center gap-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all mb-12 group">
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-2 transition-transform" />
          BACK TO ALL POSTS
        </Link>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 md:mb-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 md:mb-12">
            <Tag className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{post.category}</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tight uppercase leading-[0.9] md:leading-none mb-10 md:mb-16">
            {post.title}
          </h1>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-12 opacity-40 text-[10px] sm:text-xs font-black uppercase tracking-widest border-l-2 border-border pl-8 md:pl-12 py-2 text-muted-foreground">
            <span className="flex items-center gap-3"><Calendar className="w-4 h-4" /> {post.date}</span>
            <span className="flex items-center gap-3"><User className="w-4 h-4" /> {post.author}</span>
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="aspect-video rounded-[2.5rem] md:rounded-[4rem] overflow-hidden mb-20 md:mb-32 shadow-glow-lg border border-white/5"
        >
          <img 
            src={post.image} 
            alt={post.title}
            className="w-full h-full object-cover grayscale-[0.3]"
          />
        </motion.div>

        <article className="prose prose-invert max-w-none space-y-12 md:space-y-16">
          <p className="text-xl md:text-3xl font-medium leading-relaxed text-foreground/80 italic border-l-4 border-primary pl-8 md:pl-12">
            {post.description}
          </p>
          
          <div className="text-lg md:text-2xl font-medium text-muted-foreground leading-[1.8] space-y-12 whitespace-pre-line">
            {post.content}
          </div>
        </article>

        <div className="mt-32 pt-20 border-t border-border flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-muted overflow-hidden transition-all group-hover:bg-primary/20">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=codeyo2" alt="Author" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Written By</p>
              <p className="text-xl md:text-3xl font-black uppercase tracking-tighter">THE VIBE COLLECTIVE</p>
            </div>
          </div>
          
          <Link href="/login">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
               <button className="h-16 md:h-24 px-12 md:px-20 rounded-[1.5rem] md:rounded-[2.5rem] bg-vibe-gradient text-white font-black text-xs md:text-lg uppercase tracking-widest shadow-glow flex items-center justify-center gap-4 md:gap-8 group">
                  UPGRADE YOUR SOCIAL <ArrowRight className="w-5 h-5 md:w-8 md:h-8 group-hover:translate-x-4 transition-transform duration-500" />
               </button>
            </motion.div>
          </Link>
        </div>
      </main>

      <footer className="py-20 border-t border-border opacity-20 text-[10px] font-black uppercase tracking-widest text-center text-muted-foreground">
        <p>© 2026 VibeChat / Powered by the vibe.</p>
      </footer>
    </div>
  );
}
