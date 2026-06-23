// Mock the store + prisma so the orchestrator runs without a DB or real providers.
jest.mock('@/lib/integrations/store', () => ({
  listPublishableConnections: jest.fn(),
  mergeCredentials: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@/lib/prisma', () => ({
  prisma: { publishRecord: { create: jest.fn().mockResolvedValue({}) } },
}))

import { buildPostInput, crossPost } from '@/lib/integrations/publish'
import { listPublishableConnections, mergeCredentials } from '@/lib/integrations/store'
import { prisma } from '@/lib/prisma'

const mockList = listPublishableConnections as jest.Mock
const mockMerge = mergeCredentials as jest.Mock
const mockCreate = prisma.publishRecord.create as jest.Mock

function fakeProvider(id: string, publishImpl: jest.Mock) {
  return { provider: { id, name: id.toUpperCase(), publish: publishImpl }, connection: { credentials: {}, config: {} } }
}

beforeEach(() => {
  mockList.mockReset()
  mockMerge.mockReset()
  mockCreate.mockReset()
  mockCreate.mockResolvedValue({})
})

describe('buildPostInput', () => {
  it('builds canonical URL, markdown and a summary fallback', () => {
    const input = buildPostInput(
      { id: 'p1', title: 'Hello', slug: 'hello', excerpt: null, content: '<p>Body <strong>text</strong> here</p>', coverImage: '/cover.png', tags: [{ name: 'ts' }] },
      'https://site.com',
    )
    expect(input.url).toBe('https://site.com/blog/hello')
    expect(input.coverImageUrl).toBe('https://site.com/cover.png')
    expect(input.markdown).toBe('Body **text** here')
    expect(input.summary).toBe('Body text here') // derived from content when excerpt is null
    expect(input.tags).toEqual(['ts'])
  })

  it('prefers an explicit excerpt for the summary and keeps absolute cover URLs', () => {
    const input = buildPostInput(
      { id: 'p2', title: 'T', slug: 't', excerpt: 'Hand-written excerpt', content: '<p>x</p>', coverImage: 'https://cdn/x.png' },
      'https://site.com',
    )
    expect(input.summary).toBe('Hand-written excerpt')
    expect(input.coverImageUrl).toBe('https://cdn/x.png')
  })
})

describe('crossPost orchestration', () => {
  const input = buildPostInput(
    { id: 'p1', title: 'Hello', slug: 'hello', excerpt: 'sum', content: '<p>x</p>', coverImage: null },
    'https://site.com',
  )

  it('fans out, returns per-target results, and records every attempt', async () => {
    const ok = jest.fn().mockResolvedValue({ ok: true, remoteUrl: 'https://a/1', remoteId: '1' })
    const bad = jest.fn().mockResolvedValue({ ok: false, error: 'nope' })
    mockList.mockResolvedValue([fakeProvider('a', ok), fakeProvider('b', bad)])

    const results = await crossPost(input)

    expect(results).toHaveLength(2)
    expect(results.find((r) => r.provider === 'a')).toMatchObject({ ok: true, remoteUrl: 'https://a/1' })
    expect(results.find((r) => r.provider === 'b')).toMatchObject({ ok: false, error: 'nope' })
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('persists rotated credentials returned by a provider', async () => {
    const rot = jest.fn().mockResolvedValue({ ok: true, credentialUpdates: { accessToken: 'new' } })
    mockList.mockResolvedValue([fakeProvider('x', rot)])
    await crossPost(input)
    expect(mockMerge).toHaveBeenCalledWith('x', { accessToken: 'new' })
  })

  it('isolates a provider that throws (one failure never blocks others)', async () => {
    const boom = jest.fn().mockRejectedValue(new Error('kaboom'))
    const fine = jest.fn().mockResolvedValue({ ok: true })
    mockList.mockResolvedValue([fakeProvider('boom', boom), fakeProvider('fine', fine)])

    const results = await crossPost(input)
    expect(results.find((r) => r.provider === 'boom')).toMatchObject({ ok: false })
    expect(results.find((r) => r.provider === 'fine')).toMatchObject({ ok: true })
  })

  it('restricts targets to the requested providerIds', async () => {
    const a = jest.fn().mockResolvedValue({ ok: true })
    const b = jest.fn().mockResolvedValue({ ok: true })
    mockList.mockResolvedValue([fakeProvider('a', a), fakeProvider('b', b)])

    await crossPost(input, ['b'])
    expect(a).not.toHaveBeenCalled()
    expect(b).toHaveBeenCalledTimes(1)
  })
})
