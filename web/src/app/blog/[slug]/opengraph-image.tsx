import { ImageResponse } from 'next/og';
import posts from '@/config/blog-posts.json';

export const alt = 'VibeChat Blog';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export async function generateStaticParams() {
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return new Response('Not Found', { status: 404 });
  }

  return new ImageResponse(
    (
      <div tw="h-full w-full flex flex-col items-start justify-center bg-black p-[80px] relative overflow-hidden">
        {/* Background gradient shapes */}
        <div
          tw="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-50"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          tw="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-50"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Header / Brand */}
        <div tw="flex items-center mb-[40px]">
          <div tw="w-[48px] h-[48px] bg-[#8B5CF6] rounded-[12px] flex items-center justify-center mr-[20px]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 8-6 4 6 4V8Z" />
              <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
            </svg>
          </div>
          <span tw="text-4xl font-black tracking-tighter text-white uppercase">
            VIBE<span tw="text-[#8B5CF6]">.</span>
          </span>
        </div>

        {/* Category Badge */}
        <div tw="flex px-[16px] py-[8px] bg-white/10 border border-white/10 rounded-full mb-[32px]">
          <span tw="text-sm font-black tracking-widest text-[#8B5CF6] uppercase">
            {post.category || 'Insights'}
          </span>
        </div>

        {/* Title */}
        <h1 tw="text-7xl font-black leading-[1.1] text-white m-0 tracking-tighter max-w-[900px] uppercase">
          {post.title}
        </h1>

        {/* Footer info */}
        <div tw="flex mt-auto items-center w-full">
          <div tw="flex flex-col">
            <span tw="text-lg text-white/50 font-bold uppercase tracking-wide">
              {post.date}
            </span>
          </div>
          <div tw="ml-auto flex items-center">
            <span tw="text-lg text-white font-black uppercase tracking-wide">
              vibechat.app
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
