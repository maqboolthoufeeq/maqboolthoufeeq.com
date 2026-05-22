'use client'

import { useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes'

export function ThemeProviderWrapper({ children, ...props }: ThemeProviderProps) {
  useEffect(() => {
    const original = console.error.bind(console)
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === 'string' && args[0].includes('script')) return
      original(...args)
    }
    return () => { console.error = original }
  }, [])

  return <ThemeProvider {...props}>{children}</ThemeProvider>
}
