import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: '/supabase/:path*',
                // Use the environment variable for the destination
                destination: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/:path*`,
            },
        ];
    },
};

export default nextConfig;
