/**
 * Pure helpers for the date-range filter on the /reels and /videos pages.
 * Ranges are expressed as inclusive epoch-millisecond bounds (null = unbounded)
 * so they are trivial to compare and to unit-test without a clock.
 */

export type DatePreset = 'all' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

export interface DateRange {
  /** Inclusive start (epoch ms), or null for no lower bound. */
  from: number | null
  /** Inclusive end (epoch ms), or null for no upper bound. */
  to: number | null
}

export const EMPTY_RANGE: DateRange = { from: null, to: null }

const DAY_MS = 86_400_000

/** The rolling-window presets shown as chips, in display order. */
export const DATE_PRESETS: { id: Exclude<DatePreset, 'all' | 'custom'>; label: string; days: number }[] = [
  { id: 'week', label: 'Past week', days: 7 },
  { id: 'month', label: 'Past month', days: 30 },
  { id: 'quarter', label: 'Past 3 months', days: 90 },
  { id: 'year', label: 'Past year', days: 365 },
]

/** Turn a preset + "now" into a concrete range. Unknown / 'all' → unbounded. */
export function presetToRange(preset: DatePreset, nowMs: number): DateRange {
  const found = DATE_PRESETS.find((p) => p.id === preset)
  if (!found) return EMPTY_RANGE
  return { from: nowMs - found.days * DAY_MS, to: null }
}

// Day boundaries are computed in UTC to line up with how item dates are stored:
// an admin-picked `displayDate` is a plain calendar date persisted as UTC midnight,
// so a "From <that date>" filter must use UTC midnight too — otherwise, in
// behind-UTC timezones, an item would be excluded from a filter on its own date.

/** Start-of-day (UTC) epoch ms for a `YYYY-MM-DD` string, or null. */
export function startOfDay(dateStr: string): number | null {
  if (!dateStr) return null
  const t = new Date(`${dateStr}T00:00:00.000Z`).getTime()
  return Number.isNaN(t) ? null : t
}

/** End-of-day (UTC) epoch ms for a `YYYY-MM-DD` string, or null. */
export function endOfDay(dateStr: string): number | null {
  if (!dateStr) return null
  const t = new Date(`${dateStr}T23:59:59.999Z`).getTime()
  return Number.isNaN(t) ? null : t
}

/** Build an inclusive range from two `YYYY-MM-DD` strings (either may be empty). */
export function customRange(fromStr: string, toStr: string): DateRange {
  return { from: startOfDay(fromStr), to: endOfDay(toStr) }
}

/** True when a range actually constrains anything. */
export function isRangeActive(range: DateRange): boolean {
  return range.from != null || range.to != null
}

/**
 * Is an ISO date inside the range? An unbounded range matches everything, and
 * an unparseable date is kept (we never hide an item we can't place in time).
 */
export function isWithinRange(iso: string, range: DateRange): boolean {
  if (range.from == null && range.to == null) return true
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return true
  if (range.from != null && t < range.from) return false
  if (range.to != null && t > range.to) return false
  return true
}
