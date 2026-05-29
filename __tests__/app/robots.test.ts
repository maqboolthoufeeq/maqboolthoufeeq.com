import robots from '@/app/robots'

describe('robots.txt', () => {
  const ENV = process.env

  beforeEach(() => {
    process.env = { ...ENV, NEXT_PUBLIC_SITE_URL: 'https://maqboolthoufeeq.com' }
  })

  afterAll(() => {
    process.env = ENV
  })

  it('allows crawling of public content', () => {
    const r = robots()
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules
    expect(rule?.allow).toBe('/')
  })

  it('keeps admin and api out of the index', () => {
    const r = robots()
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules
    expect(rule?.disallow).toEqual(expect.arrayContaining(['/admin', '/api/']))
  })

  it('references the sitemap on the canonical host', () => {
    expect(robots().sitemap).toBe('https://maqboolthoufeeq.com/sitemap.xml')
  })

  it('declares the canonical host as a bare domain (no scheme, per spec)', () => {
    expect(robots().host).toBe('maqboolthoufeeq.com')
  })
})
