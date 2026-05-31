import type { Metadata } from 'next'

/**
 * Central SEO / social-metadata helpers. Every public page funnels through
 * `buildPageMetadata` so that Open Graph + Twitter Card tags, canonical URLs
 * and the default share image are emitted consistently — and automatically for
 * any future page — without duplicating the boilerplate.
 *
 * All absolute URLs are built from the *request* origin (passed in by the
 * caller via `getRequestOrigin()`), so og:url and og:image always live on the
 * exact host the crawler fetched. A host mismatch makes the image redirect,
 * which LinkedIn/Facebook reject with "cannot display preview".
 */

/**
 * NOTE: The site name, author and tagline are no longer hardcoded here. They
 * are resolved at request time from admin-editable content via `getSeo()` in
 * `lib/site-content.ts`, so anyone deploying their own copy can change the full
 * site identity from the admin panel without touching code. The helpers below
 * stay pure (no DB access) and simply take whatever values the caller resolved.
 */

/**
 * Absolute URL of the dynamically rendered default share card (`/og`), with the
 * heading + subtitle baked into the query so each page gets a tailored 1200x630
 * image even when it has no featured image of its own.
 */
export function ogCardUrl(origin: string, title: string, subtitle?: string): string {
  const params = new URLSearchParams({ title })
  if (subtitle) params.set('subtitle', subtitle)
  return `${origin}/og?${params.toString()}`
}

export type OgImage = {
  url: string
  secureUrl?: string
  width: number
  height: number
  type: string
  alt: string
}

/**
 * A single 1200x630 PNG Open Graph image descriptor. Adds `secureUrl` (rendered
 * as og:image:secure_url) when the URL is HTTPS — some stricter scrapers prefer
 * the explicit secure variant.
 */
export function ogImages(url: string, alt: string): OgImage[] {
  const img: OgImage = { url, width: 1200, height: 630, type: 'image/png', alt }
  if (url.startsWith('https://')) img.secureUrl = url
  return [img]
}

type PageMetaInput = {
  /** Request origin, e.g. https://www.example.com (no trailing slash). */
  origin: string
  /** Full document <title>, e.g. "Blog — Jane Doe". */
  title: string
  description: string
  /** Pathname for the canonical URL, e.g. "/blog". Omit (or "/") for the home page. */
  path?: string
  /** Social-card heading; falls back to `title`. */
  ogTitle?: string
  /** Absolute image URL; falls back to a tailored dynamic `/og` card. */
  image?: string
  /** og:site_name — the resolved brand/site name (see `getSeo`). */
  siteName?: string
  type?: 'website' | 'article'
}

/**
 * Build a complete, crawler-friendly Metadata object: title, description,
 * canonical URL, Open Graph (type, siteName, title, description, url, image)
 * and a `summary_large_image` Twitter card. Server-rendered by Next.js so the
 * tags are present in the initial HTML for social scrapers.
 */
export function buildPageMetadata({
  origin,
  title,
  description,
  path = '',
  ogTitle,
  image,
  siteName,
  type = 'website',
}: PageMetaInput): Metadata {
  const normalizedPath = path === '/' ? '' : path
  const canonical = `${origin}${normalizedPath}` || origin
  const heading = ogTitle ?? title
  const shareImage = image ?? ogCardUrl(origin, heading, description)

  return {
    metadataBase: new URL(origin),
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type,
      ...(siteName ? { siteName } : {}),
      title: heading,
      description,
      url: canonical,
      locale: 'en_US',
      images: ogImages(shareImage, heading),
    },
    twitter: {
      card: 'summary_large_image',
      title: heading,
      description,
      images: [shareImage],
    },
  }
}
