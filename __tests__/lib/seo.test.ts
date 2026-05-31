import { buildPageMetadata, ogCardUrl, ogImages } from '@/lib/seo'

const ORIGIN = 'https://www.example.com'

describe('ogImages', () => {
  it('returns a single 1200x630 png descriptor', () => {
    const [img] = ogImages('https://x.com/og', 'Alt text')
    expect(img).toMatchObject({ url: 'https://x.com/og', width: 1200, height: 630, type: 'image/png', alt: 'Alt text' })
  })

  it('adds secureUrl for https images (rendered as og:image:secure_url)', () => {
    expect(ogImages('https://x.com/og', 'a')[0].secureUrl).toBe('https://x.com/og')
  })

  it('omits secureUrl for non-https images', () => {
    expect(ogImages('http://localhost:3000/og', 'a')[0].secureUrl).toBeUndefined()
  })
})

describe('ogCardUrl', () => {
  it('points at the /og route on the given origin', () => {
    expect(ogCardUrl(ORIGIN, 'Blog', 'Hello')).toMatch(/^https:\/\/www\.example\.com\/og\?/)
  })

  it('URL-encodes the title and subtitle', () => {
    const url = ogCardUrl(ORIGIN, 'Tom & Jerry', 'a/b c')
    const qs = new URL(url).searchParams
    expect(qs.get('title')).toBe('Tom & Jerry')
    expect(qs.get('subtitle')).toBe('a/b c')
    expect(url).toContain('Tom+%26+Jerry') // raw "&" is encoded, not a param separator
  })

  it('omits the subtitle param when none is given', () => {
    const url = ogCardUrl(ORIGIN, 'Just a title')
    expect(new URL(url).searchParams.has('subtitle')).toBe(false)
  })
})

describe('buildPageMetadata', () => {
  it('sets a canonical URL on the request origin', () => {
    const m = buildPageMetadata({ origin: ORIGIN, title: 'Blog — X', description: 'd', path: '/blog' })
    expect(m.alternates?.canonical).toBe(`${ORIGIN}/blog`)
  })

  it('treats "/" and "" as the home canonical (no trailing slash)', () => {
    expect(buildPageMetadata({ origin: ORIGIN, title: 't', description: 'd', path: '/' }).alternates?.canonical).toBe(ORIGIN)
    expect(buildPageMetadata({ origin: ORIGIN, title: 't', description: 'd' }).alternates?.canonical).toBe(ORIGIN)
  })

  it('sets metadataBase to the request origin', () => {
    const m = buildPageMetadata({ origin: ORIGIN, title: 't', description: 'd', path: '/blog' })
    expect(m.metadataBase?.toString()).toBe(`${ORIGIN}/`)
  })

  it('emits a complete Open Graph object with an absolute 1200x630 image', () => {
    const m = buildPageMetadata({ origin: ORIGIN, title: 'Blog — X', description: 'desc', path: '/blog', ogTitle: 'Blog', siteName: 'Jane Doe' })
    const og = m.openGraph as Record<string, unknown>
    expect(og.type).toBe('website')
    expect(og.siteName).toBe('Jane Doe')
    expect(og.title).toBe('Blog')
    expect(og.url).toBe(`${ORIGIN}/blog`)
    const img = (og.images as Array<{ url: string; width: number; height: number }>)[0]
    expect(img.width).toBe(1200)
    expect(img.height).toBe(630)
    expect(img.url).toMatch(/^https:\/\/www\.example\.com\/og\?/)
  })

  it('omits og:site_name when no siteName is provided', () => {
    const m = buildPageMetadata({ origin: ORIGIN, title: 'Blog — X', description: 'desc', path: '/blog' })
    expect((m.openGraph as Record<string, unknown>).siteName).toBeUndefined()
  })

  it('emits a summary_large_image Twitter card sharing the same image', () => {
    const m = buildPageMetadata({ origin: ORIGIN, title: 'Blog — X', description: 'desc', path: '/blog', ogTitle: 'Blog' })
    const tw = m.twitter as Record<string, unknown>
    const og = m.openGraph as Record<string, unknown>
    expect(tw.card).toBe('summary_large_image')
    expect(tw.title).toBe('Blog')
    expect((tw.images as string[])[0]).toBe((og.images as Array<{ url: string }>)[0].url)
  })

  it('falls back the social heading to the full title when no ogTitle is given', () => {
    const m = buildPageMetadata({ origin: ORIGIN, title: 'Full Title', description: 'd' })
    expect((m.openGraph as Record<string, unknown>).title).toBe('Full Title')
  })

  it('honors an explicit image and og type', () => {
    const m = buildPageMetadata({
      origin: ORIGIN,
      title: 'Post',
      description: 'd',
      path: '/blog/x',
      image: `${ORIGIN}/blog/x/og`,
      type: 'article',
    })
    const og = m.openGraph as Record<string, unknown>
    expect(og.type).toBe('article')
    expect((og.images as Array<{ url: string }>)[0].url).toBe(`${ORIGIN}/blog/x/og`)
  })
})
