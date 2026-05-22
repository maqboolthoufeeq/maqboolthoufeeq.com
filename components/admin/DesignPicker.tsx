'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { DESIGNS, type Design } from '@/lib/designs'

type PreviewProps = { accent: string }

const previews: Record<string, (p: PreviewProps) => React.ReactNode> = {
  minimal: ({ accent }) => (
    <div className="flex flex-col gap-2">
      <div style={{ background: '#111118', border: '1px solid #1f1f2e', borderRadius: 12, padding: '10px 12px' }}>
        <div style={{ width: 80, height: 8, background: '#f8fafc', borderRadius: 4, marginBottom: 6 }} />
        <div style={{ width: '100%', height: 5, background: '#6b7280', borderRadius: 3, marginBottom: 3 }} />
        <div style={{ width: '70%', height: 5, background: '#6b7280', borderRadius: 3, marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ padding: '3px 8px', background: accent, borderRadius: 6, fontSize: 8, color: '#fff' }}>Live</div>
          <div style={{ padding: '3px 8px', border: '1px solid #1f1f2e', borderRadius: 6, fontSize: 8, color: '#6b7280' }}>Code</div>
        </div>
      </div>
    </div>
  ),

  glass: ({ accent }) => (
    <div className="flex flex-col gap-2" style={{ background: 'linear-gradient(135deg, #0d0d0f 0%, #1a0a2e 100%)', borderRadius: 8, padding: 8 }}>
      <div style={{
        background: `color-mix(in srgb, ${accent} 8%, rgba(255,255,255,0.04))`,
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: '10px 12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07)',
      }}>
        <div style={{ width: 80, height: 8, background: '#f8fafc', borderRadius: 4, marginBottom: 6 }} />
        <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.3)', borderRadius: 3, marginBottom: 3 }} />
        <div style={{ width: '70%', height: 5, background: 'rgba(255,255,255,0.3)', borderRadius: 3, marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ padding: '3px 8px', background: accent, borderRadius: 6, fontSize: 8, color: '#fff' }}>Live</div>
        </div>
      </div>
    </div>
  ),

  brutalist: ({ accent }) => (
    <div className="flex flex-col gap-2">
      <div style={{ background: '#080808', border: '2px solid #d4d4d4', borderRadius: 0, padding: '10px 12px' }}>
        <div style={{ width: 80, height: 8, background: '#f8fafc', borderRadius: 0, marginBottom: 6, textTransform: 'uppercase' }} />
        <div style={{ width: '100%', height: 5, background: '#5a5a5a', borderRadius: 0, marginBottom: 3 }} />
        <div style={{ width: '70%', height: 5, background: '#5a5a5a', borderRadius: 0, marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ padding: '3px 8px', background: accent, borderRadius: 0, fontSize: 8, color: '#fff', border: `2px solid ${accent}` }}>LIVE</div>
          <div style={{ padding: '3px 8px', border: '2px solid #d4d4d4', borderRadius: 0, fontSize: 8, color: '#d4d4d4' }}>CODE</div>
        </div>
      </div>
    </div>
  ),

  soft: ({ accent }) => (
    <div className="flex flex-col gap-2">
      <div style={{
        background: '#111118',
        border: 'none',
        borderRadius: 28,
        padding: '10px 12px',
        boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
      }}>
        <div style={{ width: 80, height: 8, background: '#f8fafc', borderRadius: 16, marginBottom: 6 }} />
        <div style={{ width: '100%', height: 5, background: '#6b7280', borderRadius: 16, marginBottom: 3 }} />
        <div style={{ width: '70%', height: 5, background: '#6b7280', borderRadius: 16, marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ padding: '3px 10px', background: accent, borderRadius: 999, fontSize: 8, color: '#fff' }}>Live</div>
          <div style={{ padding: '3px 10px', background: '#1f1f2e', borderRadius: 999, fontSize: 8, color: '#6b7280' }}>Code</div>
        </div>
      </div>
    </div>
  ),

  retro: ({ accent }) => (
    <div className="flex flex-col gap-2" style={{ background: '#080808', padding: 8, borderRadius: 4 }}>
      <div style={{
        background: '#0c0c0c',
        border: '1px solid #2a2a2a',
        borderRadius: 0,
        padding: '10px 12px',
        boxShadow: `4px 4px 0 ${accent}`,
        fontFamily: 'monospace',
      }}>
        <div style={{ width: 80, height: 8, background: '#d4d4d4', borderRadius: 0, marginBottom: 6 }} />
        <div style={{ width: '100%', height: 5, background: '#5a5a5a', borderRadius: 0, marginBottom: 3 }} />
        <div style={{ width: '70%', height: 5, background: '#5a5a5a', borderRadius: 0, marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ padding: '3px 8px', background: 'transparent', borderRadius: 0, fontSize: 8, color: accent, border: `1px solid ${accent}` }}>&gt; LIVE_</div>
        </div>
      </div>
    </div>
  ),
}

export default function DesignPicker({ activeId }: { activeId: string }) {
  const router = useRouter()
  const [current, setCurrent] = useState(activeId)
  const [pending, startTransition] = useTransition()
  const [saving, setSaving] = useState<string | null>(null)

  async function pick(design: Design) {
    if (design.id === current) return
    setSaving(design.id)
    const res = await fetch('/api/admin/design', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: design.id }),
    })
    setSaving(null)
    if (res.ok) {
      setCurrent(design.id)
      startTransition(() => router.refresh())
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {DESIGNS.map((design) => {
        const isActive = current === design.id
        const isLoading = saving === design.id
        const Preview = previews[design.id]

        return (
          <button
            key={design.id}
            onClick={() => pick(design)}
            disabled={!!saving || pending}
            className={`group relative text-left rounded-2xl border-2 overflow-hidden transition-all focus:outline-none disabled:cursor-wait ${
              isActive
                ? 'border-[var(--accent)] shadow-lg'
                : 'border-[var(--border)] hover:border-[var(--accent)]/60'
            }`}
          >
            {/* Mockup preview */}
            <div className="p-3 bg-[#0d0d0f] min-h-[100px] flex items-center justify-center">
              <div className="w-full">
                {Preview && <Preview accent="var(--accent)" />}
              </div>

              {isActive && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center z-10">
                  <Check size={11} className="text-white" />
                </span>
              )}

              {isLoading && (
                <span className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </span>
              )}
            </div>

            {/* Label */}
            <div className="px-3 py-2.5 bg-[var(--surface)]">
              <p className={`font-semibold text-xs ${isActive ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'}`}>
                {design.name}
              </p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5 leading-tight">{design.description}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
