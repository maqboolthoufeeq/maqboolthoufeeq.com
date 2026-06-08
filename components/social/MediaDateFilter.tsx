'use client'

import { useState } from 'react'
import {
  type DatePreset,
  type DateRange,
  DATE_PRESETS,
  EMPTY_RANGE,
  presetToRange,
  customRange,
} from '@/lib/media-filter'
import DateRangePicker from '@/components/ui/DateRangePicker'

const chipBase =
  'shrink-0 inline-flex items-center h-9 px-3.5 rounded-lg text-[13px] font-medium border transition-colors'

/**
 * Compact, single-row date filter for the /reels and /videos pages: quick rolling
 * presets as chips, plus a calendar icon that opens the same range-picker calendar
 * used on /admin/posts for an exact custom range. Emits a {from,to} range only.
 */
export default function MediaDateFilter({ onChange }: { onChange: (range: DateRange) => void }) {
  const [preset, setPreset] = useState<DatePreset>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  function pickPreset(next: Exclude<DatePreset, 'custom'>) {
    setPreset(next)
    setFrom('')
    setTo('')
    onChange(next === 'all' ? EMPTY_RANGE : presetToRange(next, Date.now()))
  }

  // Bridge the calendar's YYYY-MM-DD strings to a concrete range; an empty pair
  // falls back to "All time".
  function setCustom(nextFrom: string, nextTo: string) {
    setFrom(nextFrom)
    setTo(nextTo)
    if (!nextFrom && !nextTo) {
      setPreset('all')
      onChange(EMPTY_RANGE)
    } else {
      setPreset('custom')
      onChange(customRange(nextFrom, nextTo))
    }
  }

  return (
    <div className="mb-8 flex items-center gap-2">
      {/* Quick presets — horizontally scrollable on small screens */}
      <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 w-max pb-0.5">
          <Chip label="All time" active={preset === 'all'} onClick={() => pickPreset('all')} />
          {DATE_PRESETS.map((p) => (
            <Chip key={p.id} label={p.label} active={preset === p.id} onClick={() => pickPreset(p.id)} />
          ))}
        </div>
      </div>

      {/* Custom range — same calendar as /admin/posts, collapsed to a calendar icon */}
      <div className="shrink-0">
        <DateRangePicker
          from={from}
          to={to}
          onFromChange={(v) => setCustom(v, to)}
          onToChange={(v) => setCustom(from, v)}
          compact
        />
      </div>
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        chipBase,
        active
          ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
          : 'border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
