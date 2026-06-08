'use client'

import { useState } from 'react'
import { CalendarRange, X } from 'lucide-react'
import {
  type DatePreset,
  type DateRange,
  DATE_PRESETS,
  EMPTY_RANGE,
  presetToRange,
  customRange,
  isRangeActive,
} from '@/lib/media-filter'

const chipBase =
  'shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-colors'

/**
 * Date-range filter for the view-all pages: a scrollable row of rolling-window
 * preset chips plus a "Custom" option that reveals two native date pickers.
 * Stateless about the data — it only emits the chosen {from,to} range.
 */
export default function MediaDateFilter({ onChange }: { onChange: (range: DateRange) => void }) {
  const [preset, setPreset] = useState<DatePreset>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  function pickPreset(next: DatePreset) {
    setPreset(next)
    if (next === 'custom') onChange(customRange(from, to))
    else onChange(presetToRange(next, Date.now()))
  }

  function pickCustom(nextFrom: string, nextTo: string) {
    setFrom(nextFrom)
    setTo(nextTo)
    setPreset('custom')
    onChange(customRange(nextFrom, nextTo))
  }

  function clear() {
    setPreset('all')
    setFrom('')
    setTo('')
    onChange(EMPTY_RANGE)
  }

  const customActive = preset === 'custom' && isRangeActive(customRange(from, to))
  const showClear = preset !== 'all'

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          <CalendarRange size={14} /> Filter by date
        </span>
        {showClear && (
          <button
            type="button"
            onClick={clear}
            className="tap-scale inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Full-bleed scroller: negative margin on the wrapper, padding on the inner
          row (same pattern as TopicNav) so the chips never trigger page-level scroll. */}
      <div className="-mx-4 sm:mx-0">
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 sm:px-0 pb-1">
          <Chip label="All time" active={preset === 'all'} onClick={() => pickPreset('all')} />
          {DATE_PRESETS.map((p) => (
            <Chip key={p.id} label={p.label} active={preset === p.id} onClick={() => pickPreset(p.id)} />
          ))}
          <Chip label="Custom" active={preset === 'custom'} onClick={() => pickPreset('custom')} />
        </div>
      </div>

      {preset === 'custom' && (
        <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="block text-xs text-[var(--muted)] mb-1.5">From</span>
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => pickCustom(e.target.value, to)}
              className={dateInputCls}
            />
          </label>
          <label className="flex-1">
            <span className="block text-xs text-[var(--muted)] mb-1.5">To</span>
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => pickCustom(from, e.target.value)}
              className={dateInputCls}
            />
          </label>
          {customActive && (
            <button
              type="button"
              onClick={clear}
              className="tap-scale h-11 px-3 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              <X size={15} /> Reset
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const dateInputCls =
  'w-full h-11 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm'

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
          : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
