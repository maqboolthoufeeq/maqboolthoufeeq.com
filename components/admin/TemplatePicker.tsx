'use client'

import { useState } from 'react'
import { TEMPLATES } from '@/lib/template-defs'

const THUMBNAILS: Record<string, React.ReactNode> = {
  classic: (
    <svg viewBox="0 0 160 100" className="w-full h-full">
      <rect width="160" height="100" fill="#ffffff" />
      <rect x="0" y="0" width="160" height="14" fill="#f8f8f8" />
      <rect x="10" y="4" width="30" height="6" rx="1" fill="#e5e7eb" />
      <rect x="80" y="4" width="15" height="6" rx="1" fill="#e5e7eb" />
      <rect x="100" y="4" width="15" height="6" rx="1" fill="#e5e7eb" />
      <rect x="120" y="4" width="15" height="6" rx="1" fill="#e5e7eb" />
      <rect x="40" y="22" width="80" height="10" rx="1" fill="#1f2937" />
      <rect x="55" y="36" width="50" height="4" rx="1" fill="#9ca3af" />
      <rect x="60" y="44" width="40" height="4" rx="1" fill="#9ca3af" />
      <rect x="58" y="54" width="20" height="7" rx="2" fill="#6366f1" />
      <rect x="82" y="54" width="20" height="7" rx="2" fill="#e5e7eb" />
      <rect x="10" y="72" width="42" height="24" rx="2" fill="#f3f4f6" />
      <rect x="59" y="72" width="42" height="24" rx="2" fill="#f3f4f6" />
      <rect x="108" y="72" width="42" height="24" rx="2" fill="#f3f4f6" />
    </svg>
  ),

  centered: (
    <svg viewBox="0 0 160 100" className="w-full h-full">
      <rect width="160" height="100" fill="#0b1220" />
      <rect x="0" y="0" width="160" height="12" fill="#0f172a" />
      <rect x="10" y="3" width="25" height="6" rx="1" fill="#1e293b" />
      <rect x="105" y="3" width="15" height="6" rx="1" fill="#1e293b" />
      <rect x="125" y="3" width="15" height="6" rx="1" fill="#1e293b" />
      <rect x="55" y="18" width="50" height="3" rx="1" fill="#6366f1" />
      <rect x="30" y="26" width="100" height="10" rx="1" fill="#f1f5f9" />
      <rect x="45" y="40" width="70" height="3" rx="1" fill="#475569" />
      <rect x="50" y="47" width="60" height="3" rx="1" fill="#475569" />
      <rect x="55" y="56" width="20" height="7" rx="2" fill="#6366f1" />
      <rect x="80" y="56" width="25" height="7" rx="2" fill="#1e293b" />
      <rect x="67" y="68" width="8" height="8" rx="4" fill="#1e293b" />
      <rect x="78" y="68" width="8" height="8" rx="4" fill="#1e293b" />
      <rect x="89" y="68" width="8" height="8" rx="4" fill="#1e293b" />
    </svg>
  ),

  sidebar: (
    <svg viewBox="0 0 160 100" className="w-full h-full">
      <rect width="160" height="100" fill="#ffffff" />
      <rect x="0" y="0" width="38" height="100" fill="#f9fafb" />
      <rect x="0" y="0" width="38" height="100" fill="none" stroke="#e5e7eb" strokeWidth="1" />
      <circle cx="19" cy="18" r="10" fill="#e5e7eb" />
      <rect x="8" y="32" width="22" height="4" rx="1" fill="#1f2937" />
      <rect x="10" y="40" width="18" height="3" rx="1" fill="#9ca3af" />
      <rect x="6" y="50" width="26" height="3" rx="1" fill="#e5e7eb" />
      <rect x="6" y="57" width="26" height="3" rx="1" fill="#e5e7eb" />
      <rect x="6" y="64" width="26" height="3" rx="1" fill="#e5e7eb" />
      <rect x="6" y="74" width="10" height="5" rx="1" fill="#ddd6fe" />
      <rect x="19" y="74" width="10" height="5" rx="1" fill="#ddd6fe" />
      <rect x="46" y="14" width="60" height="7" rx="1" fill="#1f2937" />
      <rect x="46" y="26" width="90" height="3" rx="1" fill="#9ca3af" />
      <rect x="46" y="33" width="80" height="3" rx="1" fill="#9ca3af" />
      <rect x="46" y="43" width="48" height="18" rx="2" fill="#f3f4f6" />
      <rect x="100" y="43" width="48" height="18" rx="2" fill="#f3f4f6" />
      <rect x="46" y="67" width="48" height="18" rx="2" fill="#f3f4f6" />
      <rect x="100" y="67" width="48" height="18" rx="2" fill="#f3f4f6" />
    </svg>
  ),

  bento: (
    <svg viewBox="0 0 160 100" className="w-full h-full">
      <rect width="160" height="100" fill="#ffffff" />
      <rect x="0" y="0" width="160" height="12" fill="#f8f8f8" />
      <rect x="8" y="16" width="95" height="34" rx="6" fill="#f3f4f6" />
      <rect x="109" y="16" width="43" height="34" rx="6" fill="#eef2ff" />
      <rect x="8" y="55" width="43" height="38" rx="6" fill="#f3f4f6" />
      <rect x="57" y="55" width="43" height="38" rx="6" fill="#f3f4f6" />
      <rect x="106" y="55" width="46" height="18" rx="6" fill="#f3f4f6" />
      <rect x="106" y="78" width="46" height="15" rx="6" fill="#eef2ff" />
      <rect x="18" y="24" width="40" height="5" rx="1" fill="#1f2937" />
      <rect x="18" y="32" width="60" height="3" rx="1" fill="#9ca3af" />
      <rect x="18" y="38" width="15" height="5" rx="2" fill="#6366f1" />
      <circle cx="130" cy="28" r="12" fill="#e0e7ff" />
      <rect x="118" y="43" width="24" height="3" rx="1" fill="#1f2937" />
    </svg>
  ),

  terminal: (
    <svg viewBox="0 0 160 100" className="w-full h-full">
      <rect width="160" height="100" fill="#0a0a0a" />
      <rect x="0" y="0" width="160" height="12" fill="#111111" />
      <circle cx="10" cy="6" r="3" fill="#ff5f57" />
      <circle cx="20" cy="6" r="3" fill="#febc2e" />
      <circle cx="30" cy="6" r="3" fill="#28c840" />
      <rect x="10" y="18" width="18" height="3" rx="1" fill="#166534" />
      <rect x="10" y="25" width="60" height="5" rx="1" fill="#00ff41" />
      <rect x="10" y="34" width="40" height="3" rx="1" fill="#4ade80" />
      <rect x="10" y="41" width="18" height="3" rx="1" fill="#166534" />
      <rect x="10" y="48" width="130" height="12" rx="1" fill="#111111" />
      <rect x="14" y="52" width="50" height="3" rx="1" fill="#4ade80" />
      <rect x="10" y="64" width="18" height="3" rx="1" fill="#166534" />
      <rect x="10" y="71" width="100" height="8" rx="1" fill="#111111" />
      <rect x="10" y="83" width="4" height="6" fill="#00ff41" />
    </svg>
  ),

  magazine: (
    <svg viewBox="0 0 160 100" className="w-full h-full">
      <rect width="160" height="100" fill="#faf8f4" />
      <rect x="20" y="6" width="120" height="1" fill="#d4d0ca" />
      <rect x="35" y="10" width="90" height="7" rx="1" fill="#1a1814" />
      <rect x="55" y="20" width="50" height="2" rx="1" fill="#d4d0ca" />
      <rect x="20" y="24" width="120" height="1" fill="#d4d0ca" />
      <rect x="8" y="30" width="70" height="4" rx="1" fill="#1a1814" />
      <rect x="8" y="38" width="65" height="3" rx="1" fill="#6b6560" />
      <rect x="8" y="44" width="60" height="3" rx="1" fill="#6b6560" />
      <rect x="8" y="52" width="14" height="6" rx="1" fill="#1a1814" />
      <rect x="25" y="52" width="14" height="6" rx="1" fill="none" stroke="#1a1814" strokeWidth="1" />
      <rect x="85" y="28" width="67" height="38" rx="1" fill="#f2efe9" />
      <rect x="8" y="68" width="1" height="24" fill="#d4d0ca" />
      <rect x="62" y="68" width="1" height="24" fill="#d4d0ca" />
      <rect x="116" y="68" width="1" height="24" fill="#d4d0ca" />
      <rect x="12" y="70" width="44" height="3" rx="1" fill="#1a1814" />
      <rect x="12" y="77" width="44" height="2" rx="1" fill="#6b6560" />
      <rect x="12" y="82" width="30" height="2" rx="1" fill="#6b6560" />
      <rect x="66" y="70" width="44" height="3" rx="1" fill="#1a1814" />
      <rect x="66" y="77" width="44" height="2" rx="1" fill="#6b6560" />
      <rect x="66" y="82" width="30" height="2" rx="1" fill="#6b6560" />
      <rect x="120" y="70" width="32" height="3" rx="1" fill="#1a1814" />
      <rect x="120" y="75" width="4" height="4" rx="1" fill="#1a1814" />
      <rect x="126" y="77" width="26" height="2" rx="1" fill="#6b6560" />
    </svg>
  ),
}

interface Props {
  initialTemplateId: string
}

export default function TemplatePicker({ initialTemplateId }: Props) {
  const [selected, setSelected] = useState(initialTemplateId)
  const [active, setActive] = useState(initialTemplateId)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function apply() {
    setSaving(true)
    setSaved(false)
    await fetch('/api/admin/template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected }),
    })
    setActive(selected)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const selectedTemplate = TEMPLATES.find((t) => t.id === selected)

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
          {selectedTemplate?.name}
        </p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {selectedTemplate?.description}
        </p>
      </div>

      {/* Thumbnail grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {TEMPLATES.map((t) => {
          const isSelected = selected === t.id
          const isActive = active === t.id
          return (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div
                className="w-full rounded-lg overflow-hidden border-2 transition-all"
                style={{
                  aspectRatio: '4/3',
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                  boxShadow: isSelected ? '0 0 0 2px var(--accent)' : 'none',
                }}
              >
                {THUMBNAILS[t.id]}
              </div>
              <span className="text-xs" style={{ color: isSelected ? 'var(--accent)' : 'var(--muted)' }}>
                {t.name}
                {isActive && !isSelected ? '' : ''}
                {isActive ? ' ✓' : ''}
              </span>
            </button>
          )
        })}
      </div>

      <button
        onClick={apply}
        disabled={saving || selected === active}
        className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
        style={{ background: 'var(--accent)' }}
      >
        {saving ? 'Applying…' : saved ? 'Applied!' : 'Apply Template'}
      </button>
    </div>
  )
}
