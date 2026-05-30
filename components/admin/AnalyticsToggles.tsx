'use client'

import { useState } from 'react'
import Switch from './Switch'
import type { AnalyticsContent } from '@/lib/site-content'

export default function AnalyticsToggles({ initial }: { initial: AnalyticsContent }) {
  const [val, setVal] = useState<AnalyticsContent>(initial)
  const [saving, setSaving] = useState(false)

  async function update(patch: Partial<AnalyticsContent>) {
    const prev = val
    const next = { ...val, ...patch }
    setVal(next)
    setSaving(true)
    try {
      const res = await fetch('/api/site-content/analytics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
      if (!res.ok) throw new Error('save failed')
    } catch {
      setVal(prev) // roll back on failure
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="divide-y divide-[var(--border)]">
      <Row
        label="Show unique visitors"
        description="Display the unique-visitor count in the public landing-page footer."
        checked={val.showVisitors}
        disabled={saving}
        onChange={(v) => update({ showVisitors: v })}
      />
      <Row
        label="Show page views"
        description="Display the total page-view count in the public landing-page footer."
        checked={val.showPageViews}
        disabled={saving}
        onChange={(v) => update({ showPageViews: v })}
      />
      <Row
        label="Show stats on blog posts"
        description="Publicly display each post's view and zap counts at the top of the post. (You always see them as admin.)"
        checked={val.showBlogStats}
        disabled={saving}
        onChange={(v) => update({ showBlogStats: v })}
      />
    </div>
  )
}

function Row({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  disabled: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
        <p className="text-xs text-[var(--muted)] mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} disabled={disabled} onChange={onChange} label={label} />
    </div>
  )
}
