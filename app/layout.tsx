import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Lora } from 'next/font/google'
import { ThemeProviderWrapper as ThemeProvider } from '@/components/ThemeProviderWrapper'
import { prisma } from '@/lib/prisma'
import { DEFAULT_THEME_ID, getTheme, themeToCSS } from '@/lib/themes'
import { DEFAULT_DESIGN_ID } from '@/lib/designs'
import { getRequestOrigin } from '@/lib/request-origin'
import { DesignSync } from './DesignSync'
import './globals.css'

export const dynamic = 'force-dynamic'

export const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
})

export async function generateMetadata(): Promise<Metadata> {
  const origin = await getRequestOrigin()
  return {
    metadataBase: new URL(origin),
    title: 'Maqbool Thoufeeq — Full-Stack Developer',
    description: 'Full-Stack Developer building fast, beautiful web products.',
    openGraph: {
      type: 'website',
      siteName: 'Maqbool Thoufeeq',
      title: 'Maqbool Thoufeeq — Full-Stack Developer',
      description: 'Full-Stack Developer building fast, beautiful web products.',
      url: origin,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Maqbool Thoufeeq — Full-Stack Developer',
      description: 'Full-Stack Developer building fast, beautiful web products.',
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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
