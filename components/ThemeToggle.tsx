'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="w-9 h-9" />

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className="p-2 rounded-lg hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)] transition-all"
    >
      {theme === 'dark' ? (
        <Sun size={18} className="text-[var(--muted)]" />
      ) : (
        <Moon size={18} className="text-[var(--muted)]" />
      )}
    </button>
  )
}
