import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { LandingClient } from './landing-client';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import siteConfig from '@/config/site.json';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans overflow-x-hidden">
      <PublicNavbar />
      
      <LandingClient initialSession={session} />

      {/* CTA Footer - Moved to Server Component for SEO */}
      <footer className="py-24 md:py-48 border-t border-white/5 relative z-10 overflow-hidden px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl sm:text-6xl md:text-9xl font-black uppercase tracking-tighter mb-12 md:mb-20 leading-[0.9]">
            Ready to<br />
            <span className="text-primary italic">Upgrade</span> your Social?
          </h2>
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto rounded-full px-8 md:px-16 h-20 md:h-24 bg-foreground text-background hover:bg-primary hover:text-white transition-all text-lg md:text-xl font-black shadow-glow-lg">
              JOIN THE REVOLUTION
            </Button>
          </Link>
          <div className="mt-24 md:mt-48 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/20">
            <p className="text-center md:text-left">© 2026 CODE-Y02 / VibeChat. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <a href={siteConfig.links.discord} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
