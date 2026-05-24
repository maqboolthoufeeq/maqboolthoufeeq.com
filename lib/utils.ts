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
