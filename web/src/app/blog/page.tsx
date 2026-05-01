import posts from "@/config/blog-posts.json";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { BlogIndexClient } from "./blog-index-client";
import { Metadata } from "next";
import siteConfig from "@/config/site.json";

export const metadata: Metadata = {
  title: "Social Insights | The Vibe Dispatch",
  description: "Thoughts on security, the future of human discovery, and our mission to rebuild random social from the ground up.",
  alternates: { canonical: `${siteConfig.url}/blog` },
  openGraph: {
    title: "VibeChat Blog | Social Insights",
    description: "Insights into the future of private, AI-moderated social connection.",
    url: `${siteConfig.url}/blog`,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: "VibeChat Blog" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VibeChat Blog | Social Insights",
    description: "Insights into the future of private, AI-moderated social connection.",
    images: [{ url: siteConfig.twitterImage ?? siteConfig.ogImage, width: 1200, height: 600, alt: "VibeChat Blog" }],
  },
};

export default function BlogIndex() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans">
      <PublicNavbar />
      <BlogIndexClient posts={posts} />
      <footer className="py-20 border-t border-border opacity-20 text-[10px] font-black uppercase tracking-widest text-center mt-32 text-muted-foreground">
        <p>© 2026 VibeChat / Insights for the future.</p>
      </footer>
    </div>
  );
}
