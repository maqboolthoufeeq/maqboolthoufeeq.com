'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { DESIGNS } from '@/lib/designs'

const THUMBNAILS: Record<string, React.ReactNode> = {
  minimal: (
    <svg viewBox="0 0 160 100" className="w-full h-full">
      <rect width="160" height="100" fill="#ffffff" />
      <rect x="0" y="0" width="160" height="13" fill="#f9fafb" />
      <rect x="8" y="4" width="28" height="5" rx="2" fill="#e5e7eb" />
      <rect x="100" y="4" width="14" height="5" rx="2" fill="#e5e7eb" />
      <rect x="118" y="4" width="14" height="5" rx="2" fill="#e5e7eb" />
      <rect x="136" y="4" width="14" height="5" rx="2" fill="#e5e7eb" />
      <rect x="8" y="22" width="144" height="7" rx="2" fill="#1f2937" />
      <rect x="8" y="33" width="100" height="4" rx="2" fill="#9ca3af" />
      <rect x="8" y="41" width="80" height="4" rx="2" fill="#9ca3af" />
      <rect x="8" y="52" width="30" height="8" rx="3" fill="#6366f1" />
      <rect x="42" y="52" width="30" height="8" rx="3" fill="none" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="8" y="68" width="44" height="26" rx="4" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="58" y="68" width="44" height="26" rx="4" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="108" y="68" width="44" height="26" rx="4" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
    </svg>
  ),

  glass: (
    <svg viewBox="0 0 160 100" className="w-full h-full">
      <defs>
        <linearGradient id="glassBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <filter id="blur1">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>
      <rect width="160" height="100" fill="url(#glassBg)" />
      <ellipse cx="50" cy="30" rx="40" ry="30" fill="#6366f1" opacity="0.15" filter="url(#blur1)" />
      <ellipse cx="120" cy="70" rx="35" ry="25" fill="#818cf8" opacity="0.12" filter="url(#blur1)" />
      <rect x="0" y="0" width="160" height="13" fill="rgba(255,255,255,0.05)" />
      <rect x="8" y="4" width="28" height="5" rx="2" fill="rgba(255,255,255,0.2)" />
      <rect x="100" y="4" width="14" height="5" rx="2" fill="rgba(255,255,255,0.1)" />
      <rect x="118" y="4" width="14" height="5" rx="2" fill="rgba(255,255,255,0.1)" />
      <rect x="136" y="4" width="14" height="5" rx="2" fill="rgba(255,255,255,0.1)" />
      <rect x="8" y="22" width="120" height="7" rx="2" fill="#f1f5f9" />
      <rect x="8" y="33" width="90" height="4" rx="2" fill="rgba(255,255,255,0.4)" />
      <rect x="8" y="52" width="30" height="8" rx="3" fill="#6366f1" />
      <rect x="8" y="68" width="44" height="26" rx="8" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <rect x="58" y="68" width="44" height="26" rx="8" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <rect x="108" y="68" width="44" height="26" rx="8" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
    </svg>
  ),

  brutalist: (
    <svg viewBox="0 0 160 100" className="w-full h-full">
      <rect width="160" height="100" fill="#ffffff" />
      <rect x="0" y="0" width="160" height="13" fill="#ffffff" stroke="#000000" strokeWidth="2" />
      <rect x="8" y="4" width="28" height="5" fill="#000000" />
      <rect x="100" y="4" width="14" height="5" fill="#000000" />
      <rect x="118" y="4" width="14" height="5" fill="#000000" />
      <rect x="136" y="4" width="14" height="5" fill="#000000" />
      <rect x="8" y="22" width="144" height="7" fill="#000000" />
      <rect x="8" y="33" width="100" height="4" fill="#666666" />
      <rect x="8" y="41" width="80" height="4" fill="#666666" />
      <rect x="8" y="52" width="30" height="8" fill="#6366f1" />
      <rect x="42" y="52" width="30" height="8" fill="none" stroke="#000000" strokeWidth="2" />
      <rect x="8" y="68" width="44" height="26" fill="#ffffff" stroke="#000000" strokeWidth="2" />
      <rect x="58" y="68" width="44" height="26" fill="#ffffff" stroke="#000000" strokeWidth="2" />
      <rect x="108" y="68" width="44" height="26" fill="#ffffff" stroke="#000000" strokeWidth="2" />
      <rect x="10" y="96" width="44" height="2" fill="#6366f1" />
      <rect x="60" y="96" width="44" height="2" fill="#6366f1" />
      <rect x="110" y="96" width="44" height="2" fill="#6366f1" />
    </svg>
  ),

  soft: (
    <svg viewBox="0 0 160 100" className="w-full h-full">
      <defs>
        <filter id="softShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
        </filter>
      </defs>
      <rect width="160" height="100" fill="#f8f7ff" />
      <rect x="0" y="0" width="160" height="13" rx="0" fill="#ffffff" filter="url(#softShadow)" />
      <rect x="8" y="4" width="28" height="5" rx="3" fill="#e0e7ff" />
      <rect x="100" y="4" width="14" height="5" rx="3" fill="#e5e7eb" />
      <rect x="118" y="4" width="14" height="5" rx="3" fill="#e5e7eb" />
      <rect x="136" y="4" width="14" height="5" rx="3" fill="#e5e7eb" />
      <rect x="8" y="22" width="120" height="7" rx="4" fill="#1f2937" />
      <rect x="8" y="33" width="100" height="4" rx="2" fill="#9ca3af" />
      <rect x="8" y="41" width="80" height="4" rx="2" fill="#9ca3af" />
      <rect x="8" y="52" width="30" height="8" rx="6" fill="#6366f1" />
      <rect x="42" y="52" width="30" height="8" rx="6" fill="#e0e7ff" />
      <rect x="8" y="68" width="44" height="26" rx="12" fill="#ffffff" filter="url(#softShadow)" />
      <rect x="58" y="68" width="44" height="26" rx="12" fill="#ffffff" filter="url(#softShadow)" />
      <rect x="108" y="68" width="44" height="26" rx="12" fill="#ffffff" filter="url(#softShadow)" />
    </svg>
  ),

  retro: (
    <svg viewBox="0 0 160 100" className="w-full h-full">
      <rect width="160" height="100" fill="#080808" />
      <rect x="0" y="0" width="160" height="13" fill="#0c0c0c" stroke="#2a2a2a" strokeWidth="1" />
      <rect x="8" y="4" width="28" height="5" fill="#2a2a2a" />
      <rect x="100" y="4" width="14" height="5" fill="#2a2a2a" />
      <rect x="118" y="4" width="14" height="5" fill="#2a2a2a" />
      <rect x="136" y="4" width="14" height="5" fill="#2a2a2a" />
      <rect x="8" y="22" width="120" height="7" fill="#d4d4d4" />
      <rect x="8" y="33" width="100" height="4" fill="#5a5a5a" />
      <rect x="8" y="41" width="80" height="4" fill="#5a5a5a" />
      <rect x="8" y="52" width="30" height="8" fill="#6366f1" />
      <rect x="42" y="52" width="30" height="8" fill="none" stroke="#2a2a2a" strokeWidth="1" />
      <rect x="8" y="68" width="44" height="26" fill="#0c0c0c" stroke="#2a2a2a" strokeWidth="1" />
      <rect x="58" y="68" width="44" height="26" fill="#0c0c0c" stroke="#2a2a2a" strokeWidth="1" />
      <rect x="108" y="68" width="44" height="26" fill="#0c0c0c" stroke="#2a2a2a" strokeWidth="1" />
      <rect x="10" y="92" width="44" height="3" fill="#6366f1" opacity="0.6" />
      <rect x="60" y="92" width="44" height="3" fill="#6366f1" opacity="0.6" />
      <rect x="110" y="92" width="44" height="3" fill="#6366f1" opacity="0.6" />
    </svg>
  ),
}

export default function DesignPicker({ activeId }: { activeId: string }) {
  const router = useRouter()
  const [current, setCurrent] = useState(activeId)
  const [selected, setSelected] = useState(activeId)
  const [pending, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)

  const selectedDesign = DESIGNS.find((d) => d.id === selected) ?? DESIGNS[0]
  const isChanged = selected !== current

  async function apply() {
    if (!isChanged || saving) return
    setSaving(true)
    const res = await fetch('/api/admin/design', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected }),
    })
    setSaving(false)
    if (res.ok) {
      setCurrent(selected)
      document.documentElement.setAttribute('data-design', selected)
      startTransition(() => router.refresh())
    }
  }

  return (
    <div className="space-y-6">
      {/* Large preview */}
      <div
        className="w-full rounded-xl overflow-hidden border"
        style={{ borderColor: 'var(--border)', aspectRatio: '16/7', background: 'var(--surface)' }}
      >
        {THUMBNAILS[selected]}
      </div>

      <div>
        <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--foreground)' }}>
          {selectedDesign.name}
        </p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {selectedDesign.description}
        </p>
      </div>

      {/* Thumbnail grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {DESIGNS.map((d) => {
          const isSelected = selected === d.id
          const isCurrent = current === d.id
          return (
            <button
              key={d.id}
              onClick={() => setSelected(d.id)}
              disabled={saving || pending}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className="w-full rounded-lg overflow-hidden border-2 transition-all"
                style={{
                  aspectRatio: '4/3',
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                  boxShadow: isSelected ? '0 0 0 2px var(--accent)' : 'none',
                }}
              >
                {THUMBNAILS[d.id]}
              </div>
              <span className="text-xs flex items-center gap-1" style={{ color: isSelected ? 'var(--accent)' : 'var(--muted)' }}>
                {d.name}
                {isCurrent && (
                  <Check size={10} />
                )}
              </span>
            </button>
          )
        })}
      </div>

      <button
        onClick={apply}
        disabled={saving || !isChanged || pending}
        className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'var(--accent)' }}
      >
        {saving ? 'Applying…' : !isChanged ? 'Applied' : 'Apply Design'}
      </button>

      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        Click a design to preview it above, then hit{' '}
        <span style={{ color: 'var(--foreground)' }}>Apply Design</span> to save.
      </p>
    </div>
  )
}
