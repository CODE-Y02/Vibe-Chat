"use client";

import { motion } from "framer-motion";
import { Tag, Calendar, User } from "lucide-react";

import Image from "next/image";

export function BlogClientAnimations({ post }: { post: any }) {
  return (
    <>
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
         className="aspect-video rounded-[2.5rem] md:rounded-[4rem] overflow-hidden mb-20 md:mb-32 shadow-glow-lg border border-white/5 relative"
      >
        <Image 
          src={post.image} 
          alt={post.title}
          fill
          className="object-cover grayscale-[0.3]"
          priority
          sizes="(max-width: 1200px) 100vw, 1200px"
        />
      </motion.div>
    </>
  );
}
