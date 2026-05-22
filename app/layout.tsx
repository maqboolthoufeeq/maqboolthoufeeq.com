import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Lora } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { prisma } from '@/lib/prisma'
import { DEFAULT_THEME_ID, getTheme, themeToCSS } from '@/lib/themes'
import './globals.css'

export const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
})

export const metadata: Metadata = {
  title: 'Maqbool Thoufeeq — Full-Stack Developer',
  description: 'Full-Stack Developer building fast, beautiful web products.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const row = await prisma.siteContent.findUnique({ where: { key: 'theme' } })
  const themeId = (row?.value as { id?: string } | null)?.id ?? DEFAULT_THEME_ID
  const theme = getTheme(themeId)
  // themeCSS is built from hardcoded values in lib/themes.ts — no user input reaches it
  const themeCSS = themeToCSS(theme)

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        {themeCSS && <style dangerouslySetInnerHTML={{ __html: themeCSS }} />}
      </head>
      <body className={`${GeistSans.className} ${lora.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
