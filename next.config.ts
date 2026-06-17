import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // sharp is a native module used by the favicon/icon routes to crop + circle-mask
  // the profile photo; keep it external rather than bundling the native binary.
  serverExternalPackages: ['sharp'],
  // The hosted MCP server is advertised at `/mcp/` (trailing slash). With Next's
  // default behaviour every `/mcp/` request gets a 308 redirect to `/mcp`, so an
  // MCP client doing N calls actually costs 2N Vercel Edge Requests (the 308 plus
  // the real request). This was the single biggest line item in our Edge Request
  // bill. Disabling the automatic trailing-slash redirect lets `/mcp/` be served
  // directly by the route handler — one Edge Request per call. The automatic
  // redirect runs *before* rewrites, so a rewrite alone cannot prevent it; this
  // flag is the only thing that does. SEO impact is negligible: canonical URLs are
  // emitted via metadata (getSiteUrl) and are already trailing-slash-free.
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          // With skipTrailingSlashRedirect the `/mcp/` 308 is gone; map the
          // trailing-slash variant straight onto the `/mcp` route handler so it
          // always resolves to 200 (never a 404) in a single Edge Request.
          source: '/mcp/',
          destination: '/mcp',
        },
      ],
      afterFiles: [
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
      ],
    }
  },
  async headers() {
    // Baseline security headers on every response. (No strict CSP here — that needs
    // per-route nonce work; these are the safe, high-value ones with no breakage risk.)
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ]
  },
}

export default nextConfig
