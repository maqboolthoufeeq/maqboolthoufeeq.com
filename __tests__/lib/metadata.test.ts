import { getSiteUrl, absoluteUrl, stripHtml, buildExcerpt } from '@/lib/utils'

describe('getSiteUrl', () => {
  const ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...ENV }
    delete process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL
    delete process.env.VERCEL_URL
  })

  afterAll(() => {
    process.env = ENV
  })

  it('prefers NEXT_PUBLIC_SITE_URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://custom.example.com'
    expect(getSiteUrl()).toBe('https://custom.example.com')
  })

  it('falls back to the Vercel production domain with https', () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'maqboolthoufeeq.com'
    expect(getSiteUrl()).toBe('https://maqboolthoufeeq.com')
  })

  it('falls back to VERCEL_URL when no production domain is set', () => {
    process.env.VERCEL_URL = 'preview-abc.vercel.app'
    expect(getSiteUrl()).toBe('https://preview-abc.vercel.app')
  })

  it('uses the default site url as a last resort', () => {
    expect(getSiteUrl()).toBe('https://maqboolthoufeeq.com')
  })

  it('strips trailing slashes', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com/'
    expect(getSiteUrl()).toBe('https://example.com')
  })

  it('adds https:// when the override has no protocol', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'example.com'
    expect(getSiteUrl()).toBe('https://example.com')
  })
})

describe('absoluteUrl', () => {
  const base = 'https://maqboolthoufeeq.com'

  it('returns absolute URLs unchanged', () => {
    expect(absoluteUrl('https://cdn.example.com/a.png', base)).toBe('https://cdn.example.com/a.png')
    expect(absoluteUrl('http://x.com/a.png', base)).toBe('http://x.com/a.png')
  })

  it('prefixes relative paths with the base origin', () => {
    expect(absoluteUrl('/images/cover.png', base)).toBe('https://maqboolthoufeeq.com/images/cover.png')
  })

  it('adds a leading slash to bare paths', () => {
    expect(absoluteUrl('cover.png', base)).toBe('https://maqboolthoufeeq.com/cover.png')
  })

  it('handles a base with a trailing slash', () => {
    expect(absoluteUrl('/x.png', 'https://x.com/')).toBe('https://x.com/x.png')
  })
})

describe('stripHtml', () => {
  it('removes tags and collapses whitespace', () => {
    expect(stripHtml('<p>Hello   <strong>world</strong></p>')).toBe('Hello world')
  })

  it('drops script and style content', () => {
    expect(stripHtml('<style>.a{color:red}</style><p>Hi</p><script>alert(1)</script>')).toBe('Hi')
  })

  it('decodes common HTML entities', () => {
    expect(stripHtml('<p>Tom &amp; Jerry &lt;3 &quot;hi&quot;</p>')).toBe('Tom & Jerry <3 "hi"')
  })

  it('returns empty string for tag-only input', () => {
    expect(stripHtml('<br/><hr/>')).toBe('')
  })
})

describe('buildExcerpt', () => {
  it('returns short text unchanged', () => {
    expect(buildExcerpt('<p>Short post.</p>')).toBe('Short post.')
  })

  it('truncates long content on a word boundary with an ellipsis', () => {
    const content = `<p>${'word '.repeat(100)}</p>`
    const out = buildExcerpt(content, 40)
    expect(out.endsWith('…')).toBe(true)
    expect(out.length).toBeLessThanOrEqual(41)
    expect(out).not.toContain('  ')
  })

  it('respects a custom max length', () => {
    const out = buildExcerpt('<p>' + 'a'.repeat(500) + '</p>', 20)
    expect(out.length).toBeLessThanOrEqual(21)
  })
})
