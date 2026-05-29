const mockGet = jest.fn()

jest.mock('next/headers', () => ({
  headers: async () => ({ get: (k: string) => mockGet(k) }),
}))

import { getRequestOrigin } from '@/lib/request-origin'

function headerMap(map: Record<string, string | null>) {
  mockGet.mockImplementation((k: string) => map[k.toLowerCase()] ?? null)
}

describe('getRequestOrigin', () => {
  const ENV = process.env

  beforeEach(() => {
    mockGet.mockReset()
    process.env = { ...ENV }
    delete process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL
    delete process.env.VERCEL_URL
  })

  afterAll(() => {
    process.env = ENV
  })

  it('builds the origin from x-forwarded-host + x-forwarded-proto', async () => {
    headerMap({ 'x-forwarded-host': 'www.maqboolthoufeeq.com', 'x-forwarded-proto': 'https' })
    expect(await getRequestOrigin()).toBe('https://www.maqboolthoufeeq.com')
  })

  it('prefers x-forwarded-host over host', async () => {
    headerMap({ 'x-forwarded-host': 'www.maqboolthoufeeq.com', host: 'internal:3000', 'x-forwarded-proto': 'https' })
    expect(await getRequestOrigin()).toBe('https://www.maqboolthoufeeq.com')
  })

  it('falls back to the host header when no forwarded host', async () => {
    headerMap({ host: 'maqboolthoufeeq.com', 'x-forwarded-proto': 'https' })
    expect(await getRequestOrigin()).toBe('https://maqboolthoufeeq.com')
  })

  it('defaults the protocol to https', async () => {
    headerMap({ host: 'maqboolthoufeeq.com' })
    expect(await getRequestOrigin()).toBe('https://maqboolthoufeeq.com')
  })

  it('handles a comma-separated x-forwarded-proto', async () => {
    headerMap({ 'x-forwarded-host': 'example.com', 'x-forwarded-proto': 'https,http' })
    expect(await getRequestOrigin()).toBe('https://example.com')
  })

  it('falls back to the configured site url when no host header is present', async () => {
    headerMap({})
    expect(await getRequestOrigin()).toBe('https://maqboolthoufeeq.com')
  })

  it('respects NEXT_PUBLIC_SITE_URL in the no-host fallback', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://custom.example.com'
    headerMap({})
    expect(await getRequestOrigin()).toBe('https://custom.example.com')
  })

  it('falls back to the site url when the host header is malformed (no crash)', async () => {
    headerMap({ 'x-forwarded-host': 'bad host<>|', 'x-forwarded-proto': 'https' })
    expect(await getRequestOrigin()).toBe('https://maqboolthoufeeq.com')
  })

  it('strips any path injected via the host header (returns origin only)', async () => {
    headerMap({ 'x-forwarded-host': 'evil.com/inject', 'x-forwarded-proto': 'https' })
    expect(await getRequestOrigin()).toBe('https://evil.com')
  })
})
