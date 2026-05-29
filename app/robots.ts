import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/utils'

/**
 * robots.txt (served at /robots.txt). Allows crawling of public content,
 * keeps the admin area and API endpoints out of search indexes, and points
 * crawlers at the sitemap. Social-preview scrapers (LinkedIn, Facebook,
 * WhatsApp, X) fetch public pages, which remain allowed.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl()
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    // The Host directive expects a bare domain (no scheme), per the spec.
    host: new URL(base).hostname,
  }
}
