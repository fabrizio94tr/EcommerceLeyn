import type { NextConfig } from 'next';

const sbUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://localhost');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: sbUrl.protocol.replace(':', '') as 'http' | 'https', hostname: sbUrl.hostname, port: sbUrl.port, pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: 'images.unsplash.com' }
    ]
  },
  experimental: { serverActions: { bodySizeLimit: '8mb' } },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
      ]
    }];
  }
};
export default nextConfig;
