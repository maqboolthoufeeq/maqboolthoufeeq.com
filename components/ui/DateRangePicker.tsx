'use client'

import { useState, useRef, useEffect } from 'react'
import { CalendarRange, X, ChevronLeft, ChevronRight } from 'lucide-react'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseLocal(ymd: string): Date {
  return new Date(ymd + 'T12:00:00')
}

function fmtShort(ymd: string): string {
  return parseLocal(ymd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function fmtRangeLabel(from: string, to: string): string {
  if (!from && !to) return ''
  if (from && to) {
    const f = parseLocal(from)
    const t = parseLocal(to)
    if (f.getFullYear() === t.getFullYear()) {
      return `${fmtShort(from)} – ${fmtShort(to)}, ${f.getFullYear()}`
    }
    return `${fmtShort(from)}, ${f.getFullYear()} – ${fmtShort(to)}, ${t.getFullYear()}`
  }
  return `${fmtShort(from)} – …`
}

/**
 * A click-to-select date range calendar in a popover. Emits `YYYY-MM-DD` strings
 * for `from` / `to`. Used by the admin post table and the public reels/videos
 * filter so both share one calendar design.
 *
 * `compact` collapses the trigger to a bare calendar icon until a range is set
 * (used where space is tight and a preset row sits alongside it).
 */
export default function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  fullWidth = false,
  defaultOpen = false,
  compact = false,
  placeholder = 'Filter by date',
  align = 'right',
}: {
  from: string
  to: string
  onFromChange: (v: string) => void
  onToChange: (v: string) => void
  fullWidth?: boolean
  defaultOpen?: boolean
  compact?: boolean
  placeholder?: string
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)
  const [viewYear, setViewYear] = useState(() => {
    const d = from ? parseLocal(from) : new Date()
    return d.getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    const d = from ? parseLocal(from) : new Date()
    return d.getMonth()
  })

  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onPointer(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  function handleDayClick(ymd: string) {
    if (!from || (from && to)) {
      onFromChange(ymd)
      onToChange('')
    } else {
      if (ymd < from) {
        onToChange(from)
        onFromChange(ymd)
      } else if (ymd === from) {
        onToChange(ymd)
        setOpen(false)
      } else {
        onToChange(ymd)
        setOpen(false)
      }
    }
  }

  function clearDates() {
    onFromChange('')
    onToChange('')
    setOpen(false)
  }

  const hasValue = !!from || !!to

  const firstOfMonth = new Date(viewYear, viewMonth, 1)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const startPad = firstOfMonth.getDay()

  const todayYMD = toYMD(new Date())

  const effectiveTo = to || (from && hoveredDay && hoveredDay > from ? hoveredDay : null)
  const effectiveFrom = to ? from : (from && hoveredDay && hoveredDay < from ? hoveredDay : from)

  const label = fmtRangeLabel(from, to)
  const selecting = !!from && !to
  const iconOnly = compact && !hasValue

  return (
    <div ref={containerRef} className={`relative ${fullWidth ? 'w-full' : ''}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={iconOnly ? placeholder : undefined}
        title={iconOnly ? placeholder : undefined}
        className={`flex items-center gap-2 h-9 rounded-lg border text-sm transition-all ${iconOnly ? 'w-9 justify-center px-0' : 'px-3'} ${open || hasValue
          ? 'border-[var(--accent)] bg-[var(--accent)]/8 text-[var(--foreground)]'
          : 'border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:border-[var(--accent)]/50'
          } ${fullWidth ? 'w-full justify-between' : ''}`}
      >
        <CalendarRange size={iconOnly ? 15 : 13} className={hasValue ? 'text-[var(--accent)]' : 'text-[var(--muted)]'} />
        {!iconOnly && (
          <span className={`text-[13px] ${hasValue ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}`}>
            {label || placeholder}
          </span>
        )}
        {hasValue && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); clearDates() }}
            className="ml-1 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <X size={12} />
          </span>
        )}
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div
          className={`absolute z-50 top-full mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl p-3 ${fullWidth ? 'left-0 right-0' : align === 'left' ? 'left-0' : 'right-0'}`}
          style={{ minWidth: 280 }}
        >
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous month"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-all"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-[13px] font-semibold text-[var(--foreground)]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-all"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Hint */}
          <p className="text-[10px] text-[var(--muted)] text-center mb-2">
            {selecting ? 'Click end date' : 'Click start date'}
          </p>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d) => (
              <div key={d} className="flex items-center justify-center h-7 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isStart = ymd === from
              const isEnd = ymd === to || (from && !to && ymd === hoveredDay && ymd > from)
              const inRange =
                !!effectiveFrom && !!effectiveTo &&
                ymd > effectiveFrom && ymd < effectiveTo
              const isToday = ymd === todayYMD
              const isSelected = isStart || ymd === to

              return (
                <div key={ymd} className="relative flex items-center justify-center h-8">
                  {(inRange || isStart || isEnd) && (
                    <span
                      className={`absolute inset-y-1 bg-[var(--accent)]/12 ${isStart ? 'left-1/2 right-0' : isEnd ? 'left-0 right-1/2' : 'left-0 right-0'} ${isStart && isEnd ? 'hidden' : ''}`}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleDayClick(ymd)}
                    onMouseEnter={() => setHoveredDay(ymd)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`relative z-10 w-7 h-7 text-[13px] rounded-full flex items-center justify-center transition-all font-medium ${isSelected
                      ? 'bg-[var(--accent)] text-white shadow-sm'
                      : isToday
                        ? 'text-[var(--accent)] font-semibold'
                        : 'text-[var(--foreground)] hover:bg-[var(--accent)]/20'
                      }`}
                  >
                    {day}
                    {isToday && !isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)]" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          {hasValue && (
            <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-[11px] text-[var(--muted)]">{label}</span>
              <button
                type="button"
                onClick={clearDates}
                className="text-[11px] font-medium text-red-400 hover:text-red-500 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
