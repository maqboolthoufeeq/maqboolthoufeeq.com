'use client'

import { ThemeProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes'

// next-themes injects an inline <script> for theme initialization (prevents FOUC).
// React 19 warns about script tags during client reconciliation even though the
// script already ran from the SSR HTML. Patch console.error at module load time
// (before any render) so the warning is suppressed when React first encounters it.
if (typeof window !== 'undefined') {
  const _orig = console.error.bind(console)
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) return
    _orig(...args)
  }
}

export function ThemeProviderWrapper({ children, ...props }: ThemeProviderProps) {
  return <ThemeProvider {...props}>{children}</ThemeProvider>
}
