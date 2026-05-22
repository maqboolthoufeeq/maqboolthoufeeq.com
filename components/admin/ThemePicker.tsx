'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { THEMES, type Theme } from '@/lib/themes'

export default function ThemePicker({ activeId }: { activeId: string }) {
  const router = useRouter()
  const [current, setCurrent] = useState(activeId)
  const [pending, startTransition] = useTransition()
  const [saving, setSaving] = useState<string | null>(null)

  async function pick(theme: Theme) {
    if (theme.id === current) return
    setSaving(theme.id)
    const res = await fetch('/api/admin/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: theme.id }),
    })
    setSaving(null)
    if (res.ok) {
      setCurrent(theme.id)
      startTransition(() => router.refresh())
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {THEMES.map((theme) => {
        const isActive = current === theme.id
        const isLoading = saving === theme.id

        return (
          <button
            key={theme.id}
            onClick={() => pick(theme)}
            disabled={!!saving || pending}
            className={`group relative text-left rounded-2xl border-2 overflow-hidden transition-all focus:outline-none disabled:cursor-wait ${
              isActive
                ? 'border-[var(--accent)] shadow-lg'
                : 'border-[var(--border)] hover:border-[var(--accent)]/60'
            }`}
          >
            {/* Color preview */}
            <div className="h-24 relative flex items-center justify-center gap-3 p-4"
              style={{ background: `linear-gradient(135deg, ${theme.dark.background ?? '#0d0d0f'} 0%, ${theme.dark.surface ?? '#111118'} 100%)` }}
            >
              {/* Accent swatch */}
              <span
                className="w-10 h-10 rounded-full shadow-lg ring-2 ring-white/10 flex-shrink-0"
                style={{ background: theme.dark.accent }}
              />
              {/* Light mode dot */}
              <span
                className="w-6 h-6 rounded-full ring-2 ring-black/10 flex-shrink-0"
                style={{ background: theme.light.accent }}
              />

              {isActive && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center">
                  <Check size={11} className="text-white" />
                </span>
              )}

              {isLoading && (
                <span className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </span>
              )}
            </div>

            {/* Label */}
            <div className="px-4 py-3 bg-[var(--surface)]">
              <p className={`font-semibold text-sm ${isActive ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'}`}>
                {theme.name}
              </p>
              <p className="text-xs text-[var(--muted)] mt-0.5">{theme.description}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
