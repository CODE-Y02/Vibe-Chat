import { ImageResponse } from 'next/og';
import posts from '@/config/blog-posts.json';

export const runtime = 'edge';

export const alt = 'VibeChat Blog';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const post = posts.find((p) => p.slug === params.slug);

  if (!post) {
    return new Response('Not Found', { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          backgroundColor: '#000',
          padding: '80px',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background gradient */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
            borderRadius: '100%',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            left: '-10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
            borderRadius: '100%',
            filter: 'blur(60px)',
          }}
        />

        {/* Header / Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#8B5CF6',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '20px',
            }}
          >
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 8-6 4 6 4V8Z" />
                <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
              </svg>
          </div>
          <span
            style={{
              fontSize: '32px',
              fontWeight: 900,
              letterSpacing: '-0.05em',
              color: 'white',
              textTransform: 'uppercase',
            }}
          >
            VIBE<span style={{ color: '#8B5CF6' }}>.</span>
          </span>
        </div>

        {/* Category Badge */}
        <div
          style={{
            display: 'flex',
            padding: '8px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '100px',
            marginBottom: '32px',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 900,
              letterSpacing: '0.2em',
              color: '#8B5CF6',
              textTransform: 'uppercase',
            }}
          >
            {post.category || 'Insights'}
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '72px',
            fontWeight: 900,
            lineHeight: 1.1,
            color: 'white',
            margin: 0,
            letterSpacing: '-0.04em',
            maxWidth: '900px',
            textTransform: 'uppercase',
          }}
        >
          {post.title}
        </h1>

        {/* Footer info */}
        <div
          style={{
            display: 'flex',
            marginTop: 'auto',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span
              style={{
                fontSize: '18px',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              {post.date}
            </span>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
            }}
          >
             <span
              style={{
                fontSize: '18px',
                color: 'white',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
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
