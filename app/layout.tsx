import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Lora } from 'next/font/google'
import { ThemeProviderWrapper as ThemeProvider } from '@/components/ThemeProviderWrapper'
import { prisma } from '@/lib/prisma'
import { DEFAULT_THEME_ID, getTheme, themeToCSS } from '@/lib/themes'
import { DEFAULT_DESIGN_ID } from '@/lib/designs'
import { getRequestOrigin } from '@/lib/request-origin'
import { getSeo } from '@/lib/site-content'
import { ogCardUrl, ogImages } from '@/lib/seo'
import { DesignSync } from './DesignSync'
import VisitTracker from '@/components/VisitTracker'
import './globals.css'

export const dynamic = 'force-dynamic'

export const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
})

export async function generateMetadata(): Promise<Metadata> {
  const [origin, seo] = await Promise.all([getRequestOrigin(), getSeo()])
  const title = `${seo.siteName} — ${seo.role}`
  // Default share image used as the fallback for any page that doesn't set its
  // own openGraph (and inherited by future pages automatically).
  const ogImage = ogCardUrl(origin, title, seo.tagline)
  return {
    metadataBase: new URL(origin),
    title,
    description: seo.tagline,
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
  const [themeRow, designRow] = await Promise.all([
    prisma.siteContent.findUnique({ where: { key: 'theme' } }),
    prisma.siteContent.findUnique({ where: { key: 'design' } }),
  ])
  const themeId = (themeRow?.value as { id?: string } | null)?.id ?? DEFAULT_THEME_ID
  const designId = (designRow?.value as { id?: string } | null)?.id ?? DEFAULT_DESIGN_ID
  const theme = getTheme(themeId)
  // themeCSS is built from hardcoded values in lib/themes.ts — no user input reaches it
  const themeCSS = themeToCSS(theme)

  return (
    <html lang="en" suppressHydrationWarning data-design={designId}>
      <head>
        { }
        {themeCSS && <style dangerouslySetInnerHTML={{ __html: themeCSS }} />}
      </head>
      <body className={`${GeistSans.className} ${lora.variable}`}>
        <DesignSync designId={designId} />
        <VisitTracker />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
