const findMany = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: { post: { findMany: (...a: unknown[]) => findMany(...a) } },
}))

import sitemap from '@/app/sitemap'

describe('sitemap.xml', () => {
  const ENV = process.env

  beforeEach(() => {
    findMany.mockReset()
    process.env = { ...ENV, NEXT_PUBLIC_SITE_URL: 'https://maqboolthoufeeq.com' }
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
        'https://maqboolthoufeeq.com',
        'https://maqboolthoufeeq.com/blog',
        'https://maqboolthoufeeq.com/projects',
        'https://maqboolthoufeeq.com/blog/hello-world',
        'https://maqboolthoufeeq.com/blog/second-post',
      ]),
    )
  })

  it('lists the home page without a trailing slash (matches its canonical)', async () => {
    findMany.mockResolvedValue([])
    const entries = await sitemap()
    expect(entries[0].url).toBe('https://maqboolthoufeeq.com')
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
    const entries = await sitemap()
    expect(entries.map((e) => e.url)).toEqual([
      'https://maqboolthoufeeq.com',
      'https://maqboolthoufeeq.com/blog',
      'https://maqboolthoufeeq.com/projects',
    ])
  })
})
