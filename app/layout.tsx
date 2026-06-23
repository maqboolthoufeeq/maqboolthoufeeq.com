import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Lora } from 'next/font/google'
import { ThemeProviderWrapper as ThemeProvider } from '@/components/ThemeProviderWrapper'
import { prisma } from '@/lib/prisma'
import { DEFAULT_THEME_ID, getTheme, themeToCSS } from '@/lib/themes'
import { DEFAULT_DESIGN_ID } from '@/lib/designs'
import { getRequestOrigin } from '@/lib/request-origin'
import { getSeo, getSiteContent } from '@/lib/site-content'
import { ogCardUrl, ogImages } from '@/lib/seo'
import { absoluteUrl } from '@/lib/utils'
import { identityGraph, normalizeSameAs } from '@/lib/structured-data'
import { JsonLd } from '@/components/JsonLd'
import { DesignSync } from './DesignSync'
import VisitTracker from '@/components/VisitTracker'
import AgentationDev from '@/components/AgentationDev'
import './globals.css'

export const dynamic = 'force-dynamic'

export const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
})

export async function generateMetadata(): Promise<Metadata> {
  const [origin, seo, about] = await Promise.all([getRequestOrigin(), getSeo(), getSiteContent('about')])
  const title = `${seo.siteName} — ${seo.role}`
  // Default share image used as the fallback for any page that doesn't set its
  // own openGraph (and inherited by future pages automatically).
  const ogImage = ogCardUrl(origin, title, seo.tagline)

  // Keyword set from the resolved identity + admin-listed skills. Search engines
  // largely ignore the keywords meta, but some AI/answer engines still read it
  // and it costs nothing; kept de-duped and free of empties.
  const keywords = Array.from(
    new Set(
      [seo.siteName, seo.author, seo.role, ...(about.skills ?? []), 'portfolio', 'blog', 'software engineer']
        .map((k) => k?.trim())
        .filter((k): k is string => !!k),
    ),
  )

  // Search Console / Bing verification only when the token is provided via env —
  // never a hardcoded token.
  const verification: NonNullable<Metadata['verification']> = {}
  if (process.env.GOOGLE_SITE_VERIFICATION) verification.google = process.env.GOOGLE_SITE_VERIFICATION
  if (process.env.BING_SITE_VERIFICATION) verification.other = { 'msvalidate.01': process.env.BING_SITE_VERIFICATION }

  return {
    metadataBase: new URL(origin),
    title,
    description: seo.tagline,
    applicationName: seo.siteName,
    keywords,
    authors: [{ name: seo.author, url: origin }],
    creator: seo.author,
    publisher: seo.author,
    category: 'technology',
    alternates: { canonical: origin },
    formatDetection: { email: false, telephone: false, address: false },
    // Allow full indexing and let Google show large image previews + full-length
    // snippets (important for rich results and AI Overviews).
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    ...(Object.keys(verification).length ? { verification } : {}),
    openGraph: {
      type: 'website',
      siteName: seo.siteName,
      title,
      description: seo.tagline,
      url: origin,
      locale: 'en_US',
      images: ogImages(ogImage, title),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: seo.tagline,
      images: [ogImage],
    },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f1f5f9' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0d0f' },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [themeRow, designRow, origin, seo, hero, about, contact] = await Promise.all([
    prisma.siteContent.findUnique({ where: { key: 'theme' } }),
    prisma.siteContent.findUnique({ where: { key: 'design' } }),
    getRequestOrigin(),
    getSeo(),
    getSiteContent('hero'),
    getSiteContent('about'),
    getSiteContent('contact'),
  ])
  const themeId = (themeRow?.value as { id?: string } | null)?.id ?? DEFAULT_THEME_ID
  const designId = (designRow?.value as { id?: string } | null)?.id ?? DEFAULT_DESIGN_ID
  const theme = getTheme(themeId)
  // themeCSS is built from hardcoded values in lib/themes.ts — no user input reaches it
  const themeCSS = themeToCSS(theme)

  // Sitewide schema.org identity graph (WebSite + Organization + Person), all
  // resolved from admin-editable content. Lets Google/AI engines treat the
  // author as one entity across every page (knowledge graph + E-E-A-T).
  const siteGraph = identityGraph({
    origin,
    seo,
    imageUrl: hero.imageUrl ? absoluteUrl(hero.imageUrl, origin) : undefined,
    sameAs: normalizeSameAs(hero.socialLinks),
    knowsAbout: (about.skills ?? []).slice(0, 25),
    email: contact.email?.trim() || undefined,
  })

  return (
    <html lang="en" suppressHydrationWarning data-design={designId}>
      <head>
        {themeCSS && <style dangerouslySetInnerHTML={{ __html: themeCSS }} />}
        <JsonLd data={siteGraph} />
      </head>
      <body className={`${GeistSans.className} ${lora.variable}`}>
        <DesignSync designId={designId} />
        <VisitTracker />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
        {/* Dev-only annotation toolbar for AI agents — never rendered in production. */}
        {process.env.NODE_ENV === 'development' && <AgentationDev />}
      </body>
    </html>
  )
}
