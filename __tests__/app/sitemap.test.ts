const findMany = jest.fn()
const mediaFindMany = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    post: { findMany: (...a: unknown[]) => findMany(...a) },
    mediaCategory: { findMany: (...a: unknown[]) => mediaFindMany(...a) },
  },
}))

import sitemap from '@/app/sitemap'

describe('sitemap.xml', () => {
  const ENV = process.env

  beforeEach(() => {
    findMany.mockReset()
    mediaFindMany.mockReset()
    mediaFindMany.mockResolvedValue([])
    process.env = { ...ENV, NEXT_PUBLIC_SITE_URL: 'https://example.com' }
  })

  afterAll(() => {
    process.env = ENV
  })

  it('lists the static routes plus every published post', async () => {
    findMany.mockResolvedValue([
      { slug: 'hello-world', updatedAt: new Date('2026-01-02'), publishedAt: new Date('2026-01-01') },
      { slug: 'second-post', updatedAt: null, publishedAt: new Date('2025-12-01') },
    ])

    const entries = await sitemap()
    const urls = entries.map((e) => e.url)

    expect(urls).toEqual(
      expect.arrayContaining([
        'https://example.com',
        'https://example.com/blog',
        'https://example.com/projects',
        'https://example.com/blog/hello-world',
        'https://example.com/blog/second-post',
      ]),
    )
  })

  it('lists the home page without a trailing slash (matches its canonical)', async () => {
    findMany.mockResolvedValue([])
    const entries = await sitemap()
    expect(entries[0].url).toBe('https://example.com')
  })

  it('queries only published posts', async () => {
    findMany.mockResolvedValue([])
    await sitemap()
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { published: true } }))
  })

  it('uses updatedAt for lastModified, falling back to publishedAt', async () => {
    const updated = new Date('2026-01-02')
    const published = new Date('2025-12-01')
    findMany.mockResolvedValue([
      { slug: 'a', updatedAt: updated, publishedAt: published },
      { slug: 'b', updatedAt: null, publishedAt: published },
    ])
    const entries = await sitemap()
    const a = entries.find((e) => e.url.endsWith('/blog/a'))
    const b = entries.find((e) => e.url.endsWith('/blog/b'))
    expect(a?.lastModified).toBe(updated)
    expect(b?.lastModified).toBe(published)
  })

  it('still serves the static routes when the database is unreachable', async () => {
    findMany.mockRejectedValue(new Error('connection refused'))
    mediaFindMany.mockRejectedValue(new Error('connection refused'))
    const entries = await sitemap()
    expect(entries.map((e) => e.url)).toEqual([
      'https://example.com',
      'https://example.com/blog',
      'https://example.com/projects',
      'https://example.com/reels',
      'https://example.com/videos',
    ])
  })

  it('adds reel/video topic pages for categories with published items', async () => {
    findMany.mockResolvedValue([])
    mediaFindMany.mockResolvedValue([
      { slug: 'travel', updatedAt: new Date('2026-01-01'), items: [{ platform: 'instagram' }, { platform: 'youtube' }] },
      { slug: 'talks', updatedAt: null, items: [{ platform: 'youtube' }] },
    ])
    const urls = (await sitemap()).map((e) => e.url)
    expect(urls).toEqual(
      expect.arrayContaining([
        'https://example.com/reels/travel',
        'https://example.com/videos/travel',
        'https://example.com/videos/talks',
      ]),
    )
    expect(urls).not.toContain('https://example.com/reels/talks')
  })

  it('attaches the cover image to a post entry for image indexing', async () => {
    findMany.mockResolvedValue([
      { slug: 'with-cover', updatedAt: new Date('2026-01-02'), publishedAt: new Date('2026-01-01'), coverImage: 'https://cdn.example.com/cover.png' },
      { slug: 'no-cover', updatedAt: null, publishedAt: new Date('2025-12-01'), coverImage: null },
    ])
    const entries = await sitemap()
    const withCover = entries.find((e) => e.url.endsWith('/blog/with-cover'))
    const noCover = entries.find((e) => e.url.endsWith('/blog/no-cover'))
    expect(withCover?.images).toEqual(['https://cdn.example.com/cover.png'])
    expect(noCover?.images).toBeUndefined()
  })
})
