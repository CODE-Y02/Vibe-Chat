import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                // Any request to /supabase/... is proxied to Supabase.
                // This lets the browser talk to our domain instead of supabase.co
                // (bypasses Jio ISP block on the supabase.co domain).
                source: '/supabase/:path*',
                destination: 'https://nujpmmtiaxhxzjgegaxs.supabase.co/:path*',
            },
        ];
    },
};

export default nextConfig;
