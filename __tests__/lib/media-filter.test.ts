import {
  presetToRange,
  customRange,
  startOfDay,
  endOfDay,
  isWithinRange,
  isRangeActive,
  EMPTY_RANGE,
  DATE_PRESETS,
} from '@/lib/media-filter'

const NOW = new Date('2026-06-08T12:00:00').getTime()
const DAY = 86_400_000

describe('presetToRange', () => {
  it('returns an unbounded range for "all" and unknown presets', () => {
    expect(presetToRange('all', NOW)).toEqual(EMPTY_RANGE)
    // @ts-expect-error — exercising the defensive fallback
    expect(presetToRange('bogus', NOW)).toEqual(EMPTY_RANGE)
  })

  it('rolls the lower bound back by the preset window', () => {
    expect(presetToRange('week', NOW)).toEqual({ from: NOW - 7 * DAY, to: null })
    expect(presetToRange('month', NOW)).toEqual({ from: NOW - 30 * DAY, to: null })
    expect(presetToRange('quarter', NOW)).toEqual({ from: NOW - 90 * DAY, to: null })
    expect(presetToRange('year', NOW)).toEqual({ from: NOW - 365 * DAY, to: null })
  })

  it('exposes the chip presets in display order', () => {
    expect(DATE_PRESETS.map((p) => p.id)).toEqual(['week', 'month', 'quarter', 'year'])
  })
})

describe('startOfDay / endOfDay', () => {
  it('parses a YYYY-MM-DD string to UTC day boundaries', () => {
    expect(startOfDay('2026-06-08')).toBe(Date.UTC(2026, 5, 8, 0, 0, 0, 0))
    expect(endOfDay('2026-06-08')).toBe(Date.UTC(2026, 5, 8, 23, 59, 59, 999))
  })
  it('returns null for empty / invalid input', () => {
    expect(startOfDay('')).toBeNull()
    expect(endOfDay('')).toBeNull()
    expect(startOfDay('not-a-date')).toBeNull()
  })
})

describe('customRange', () => {
  it('builds an inclusive range from two dates', () => {
    const r = customRange('2026-01-01', '2026-01-31')
    expect(r.from).toBe(Date.UTC(2026, 0, 1, 0, 0, 0, 0))
    expect(r.to).toBe(Date.UTC(2026, 0, 31, 23, 59, 59, 999))
  })
  it('allows open-ended ranges', () => {
    expect(customRange('2026-01-01', '')).toEqual({ from: startOfDay('2026-01-01'), to: null })
    expect(customRange('', '2026-01-31')).toEqual({ from: null, to: endOfDay('2026-01-31') })
  })
})

describe('isRangeActive', () => {
  it('is false only when both bounds are null', () => {
    expect(isRangeActive(EMPTY_RANGE)).toBe(false)
    expect(isRangeActive({ from: NOW, to: null })).toBe(true)
    expect(isRangeActive({ from: null, to: NOW })).toBe(true)
  })
})

describe('isWithinRange', () => {
  const iso = '2026-06-08T12:00:00.000Z'

  it('matches everything when unbounded', () => {
    expect(isWithinRange(iso, EMPTY_RANGE)).toBe(true)
  })

  it('respects the lower bound', () => {
    expect(isWithinRange(iso, { from: new Date('2026-06-01T00:00:00.000Z').getTime(), to: null })).toBe(true)
    expect(isWithinRange(iso, { from: new Date('2026-07-01T00:00:00.000Z').getTime(), to: null })).toBe(false)
  })

  it('respects the upper bound', () => {
    expect(isWithinRange(iso, { from: null, to: new Date('2026-07-01T00:00:00.000Z').getTime() })).toBe(true)
    expect(isWithinRange(iso, { from: null, to: new Date('2026-06-01T00:00:00.000Z').getTime() })).toBe(false)
  })

  it('keeps items whose date cannot be parsed', () => {
    expect(isWithinRange('garbage', { from: NOW, to: null })).toBe(true)
  })
})
