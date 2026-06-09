import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // sharp is a native module used by the favicon/icon routes to crop + circle-mask
  // the profile photo; keep it external rather than bundling the native binary.
  serverExternalPackages: ['sharp'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        // Serve the dynamic photo icon for blind /favicon.ico probes too (Next
        // injects rel="icon" → /icon from app/icon.tsx; this also answers clients
        // and scrapers that request /favicon.ico directly).
        source: '/favicon.ico',
        destination: '/icon',
      },
      {
        source: '/.well-known/oauth-authorization-server',
        destination: '/api/oauth-metadata/authorization-server',
      },
      {
        source: '/.well-known/oauth-protected-resource',
        destination: '/api/oauth-metadata/protected-resource',
      },
      {
        source: '/authorize',
        destination: '/api/oauth/authorize',
      },
    ]
  },
}

export default nextConfig
