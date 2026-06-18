import {
  BANNER_VARIANTS,
  isSafeBannerUrl,
  normalizeVariant,
  validateBanner,
  type CleanBanner,
} from '@/lib/banner-types'

function dataOf(result: ReturnType<typeof validateBanner>): Partial<CleanBanner> {
  if ('error' in result) throw new Error(`expected data, got error: ${result.error}`)
  return result.data
}

describe('isSafeBannerUrl', () => {
  it('accepts site-relative paths', () => {
    expect(isSafeBannerUrl('/blog')).toBe(true)
    expect(isSafeBannerUrl('/announcements')).toBe(true)
  })

  it('accepts http(s), mailto and tel', () => {
    expect(isSafeBannerUrl('https://example.com')).toBe(true)
    expect(isSafeBannerUrl('http://example.com')).toBe(true)
    expect(isSafeBannerUrl('mailto:hi@example.com')).toBe(true)
    expect(isSafeBannerUrl('tel:+15551234567')).toBe(true)
  })

  it('rejects protocol-relative and dangerous schemes', () => {
    expect(isSafeBannerUrl('//evil.com')).toBe(false)
    expect(isSafeBannerUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeBannerUrl('data:text/html,boom')).toBe(false)
    expect(isSafeBannerUrl('not a url')).toBe(false)
  })
})

describe('normalizeVariant', () => {
  it('passes through known variants', () => {
    for (const v of BANNER_VARIANTS) expect(normalizeVariant(v)).toBe(v)
  })

  it('falls back to "info" for unknown values', () => {
    expect(normalizeVariant('bogus')).toBe('info')
    expect(normalizeVariant(undefined)).toBe('info')
    expect(normalizeVariant(42)).toBe('info')
  })
})

describe('validateBanner', () => {
  it('requires a non-empty message when creating', () => {
    expect(validateBanner({})).toEqual({ error: 'Message is required' })
    expect(validateBanner({ message: '   ' })).toEqual({ error: 'Message is required' })
  })

  it('trims the message and defaults optional fields', () => {
    const data = dataOf(validateBanner({ message: '  Hello world  ' }))
    expect(data.message).toBe('Hello world')
  })

  it('rejects an over-long message', () => {
    const result = validateBanner({ message: 'x'.repeat(281) })
    expect('error' in result).toBe(true)
  })

  it('normalises the variant and active flag', () => {
    const data = dataOf(validateBanner({ message: 'hi', variant: 'warning', active: 0 }))
    expect(data.variant).toBe('warning')
    expect(data.active).toBe(false)
  })

  it('coerces blank optional links to null', () => {
    const data = dataOf(validateBanner({ message: 'hi', linkLabel: '', linkUrl: '' }))
    expect(data.linkLabel).toBeNull()
    expect(data.linkUrl).toBeNull()
  })

  it('rejects an unsafe link url', () => {
    const result = validateBanner({ message: 'hi', linkUrl: 'javascript:alert(1)' })
    expect('error' in result).toBe(true)
  })

  it('skips the required-message check in partial mode', () => {
    const data = dataOf(validateBanner({ active: true }, { partial: true }))
    expect(data).toEqual({ active: true })
    expect(data.message).toBeUndefined()
  })
})
