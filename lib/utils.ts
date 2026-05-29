import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { NextRequest } from 'next/server'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function readingTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

export function isExternal(href: string): boolean {
  return href.startsWith('http://') || href.startsWith('https://')
}

export function getPublicOrigin(req: NextRequest): string {
  const forwardedHost = req.headers.get('x-forwarded-host')
  if (forwardedHost) {
    const proto = req.headers.get('x-forwarded-proto') ?? 'https'
    return `${proto}://${forwardedHost}`
  }
  return new URL(req.url).origin
}

const DEFAULT_SITE_URL = 'https://maqboolthoufeeq.com'

/**
 * Canonical site origin for use in server components / metadata where no
 * request object is available (e.g. generateMetadata). Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL (explicit override)
 *   2. VERCEL_PROJECT_PRODUCTION_URL (Vercel production domain)
 *   3. VERCEL_URL (Vercel preview/deploy domain)
 *   4. DEFAULT_SITE_URL fallback
 * Always returns an origin with no trailing slash.
 */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    DEFAULT_SITE_URL

  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  return withProto.replace(/\/+$/, '')
}

/** Resolve a possibly-relative path/URL into an absolute URL against the site origin. */
export function absoluteUrl(pathOrUrl: string, base: string = getSiteUrl()): string {
  if (!pathOrUrl) return base
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const origin = base.replace(/\/+$/, '')
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${origin}${path}`
}

/** Strip HTML tags and collapse whitespace into plain text (server-safe, no DOM). */
export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Build a share/SEO description from rich-text content, capped at `max`
 * characters on a word boundary with an ellipsis when truncated.
 */
export function buildExcerpt(content: string, max = 160): string {
  const text = stripHtml(content)
  if (text.length <= max) return text
  const sliced = text.slice(0, max)
  const lastSpace = sliced.lastIndexOf(' ')
  const trimmed = (lastSpace > max * 0.6 ? sliced.slice(0, lastSpace) : sliced).trimEnd()
  return `${trimmed}…`
}
