import posts from "@/config/blog-posts.json";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar, User, Tag } from "lucide-react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import siteConfig from "@/config/site.json";
import { BlogClientAnimations } from "./blog-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);

  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `${siteConfig.url}/blog/${post.slug}`,
      images: [{ url: post.image, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [{ url: post.image, width: 1200, height: 600, alt: post.title }],
    },
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans">
      <PublicNavbar />

      <main className="container mx-auto px-4 max-w-4xl py-24 md:py-48 relative z-10">
        <Link href="/blog" className="inline-flex items-center gap-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all mb-12 group">
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-2 transition-transform" />
          BACK TO ALL POSTS
        </Link>
        
        <BlogClientAnimations post={post} />

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
            <button className="h-16 md:h-24 px-12 md:px-20 rounded-[1.5rem] md:rounded-[2.5rem] bg-vibe-gradient text-white font-black text-xs md:text-lg uppercase tracking-widest shadow-glow flex items-center justify-center gap-4 md:gap-8 group transition-transform hover:scale-105 active:scale-95">
                UPGRADE YOUR SOCIAL <ArrowRight className="w-5 h-5 md:w-8 md:h-8 group-hover:translate-x-4 transition-transform duration-500" />
            </button>
          </Link>
        </div>
      </main>

      <footer className="py-20 border-t border-border opacity-20 text-[10px] font-black uppercase tracking-widest text-center text-muted-foreground">
        <p>© 2026 VibeChat / Powered by the vibe.</p>
      </footer>
    </div>
  );
}
