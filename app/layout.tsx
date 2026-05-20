import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Lora } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.className} ${lora.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
