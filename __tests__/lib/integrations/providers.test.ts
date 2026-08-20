import type { PublishInput } from '@/lib/integrations/types'

// Mock the outbound HTTP layer but keep the pure helpers (extractApiError, guards).
jest.mock('@/lib/integrations/http', () => {
  const actual = jest.requireActual('@/lib/integrations/http')
  return { ...actual, fetchJson: jest.fn(), safeFetch: jest.fn() }
})

import { fetchJson, safeFetch } from '@/lib/integrations/http'
import { devto } from '@/lib/integrations/providers/devto'
import { telegram } from '@/lib/integrations/providers/telegram'
import { discord } from '@/lib/integrations/providers/discord'
import { announceText } from '@/lib/integrations/providers/shared'
import { listProviders, getProvider } from '@/lib/integrations/registry'

const mockFetchJson = fetchJson as jest.Mock
const mockSafeFetch = safeFetch as jest.Mock

const input: PublishInput = {
  contentType: 'post',
  contentId: 'p1',
  title: 'My Post',
  summary: 'A short summary.',
  html: '<p>Hello <strong>world</strong></p>',
  markdown: 'Hello **world**',
  url: 'https://example.com/blog/my-post',
  coverImageUrl: 'https://example.com/cover.png',
  tags: ['TypeScript', 'Web Dev'],
}

beforeEach(() => {
  mockFetchJson.mockReset()
  mockSafeFetch.mockReset()
})

describe('dev.to provider', () => {
  it('posts the full markdown article with canonical_url and parses the result', async () => {
    mockFetchJson.mockResolvedValue({ status: 201, data: { url: 'https://dev.to/me/my-post', id: 99 } })
    const res = await devto.publish!(input, { credentials: { apiKey: 'KEY' }, config: {} })

    expect(res.ok).toBe(true)
    expect(res.remoteUrl).toBe('https://dev.to/me/my-post')
    expect(res.remoteId).toBe('99')

    const [url, opts] = mockFetchJson.mock.calls[0]
    expect(url).toBe('https://dev.to/api/articles')
    expect(opts.method).toBe('POST')
    expect(opts.headers['api-key']).toBe('KEY')
    const body = JSON.parse(opts.body)
    expect(body.article.body_markdown).toBe('Hello **world**')
    expect(body.article.canonical_url).toBe('https://example.com/blog/my-post')
    expect(body.article.published).toBe(true)
    expect(body.article.tags).toEqual(['typescript', 'webdev'])
  })

  it('returns a clean error on a non-2xx response', async () => {
    mockFetchJson.mockResolvedValue({ status: 422, data: { error: 'Validation failed' } })
    const res = await devto.publish!(input, { credentials: { apiKey: 'KEY' }, config: {} })
    expect(res.ok).toBe(false)
    expect(res.error).toBe('Validation failed')
  })
})

describe('telegram provider', () => {
  it('sends an HTML message and builds a t.me URL for public channels', async () => {
    mockFetchJson.mockResolvedValue({ status: 200, data: { ok: true, result: { message_id: 7 } } })
    const res = await telegram.publish!(input, { credentials: { botToken: '123:ABC' }, config: { chatId: '@mychannel' } })
    expect(res.ok).toBe(true)
    expect(res.remoteUrl).toBe('https://t.me/mychannel/7')
    const [url, opts] = mockFetchJson.mock.calls[0]
    expect(url).toContain('/bot123%3AABC/sendMessage')
    const body = JSON.parse(opts.body)
    expect(body.parse_mode).toBe('HTML')
    expect(body.text).toContain('My Post')
    expect(body.text).toContain('https://example.com/blog/my-post')
  })
})

describe('discord provider', () => {
  it('posts an embed to the webhook with wait=true', async () => {
    mockFetchJson.mockResolvedValue({ status: 200, data: { id: '555', channel_id: '777' } })
    const res = await discord.publish!(input, {
      credentials: { webhookUrl: 'https://discord.com/api/webhooks/1/token' },
      config: {},
    })
    expect(res.ok).toBe(true)
    expect(res.remoteId).toBe('555')
    const [url, opts] = mockFetchJson.mock.calls[0]
    expect(url).toContain('wait=true')
    const body = JSON.parse(opts.body)
    expect(body.embeds[0].title).toBe('My Post')
    expect(body.embeds[0].url).toBe('https://example.com/blog/my-post')
  })
})

describe('announceText', () => {
  it('includes title, summary and url within the length budget', () => {
    const text = announceText(input, { maxLength: 280 })
    expect(text).toContain('My Post')
    expect(text).toContain('https://example.com/blog/my-post')
    expect(text.length).toBeLessThanOrEqual(280)
  })
  it('respects a small budget by truncating the body but keeping the url', () => {
    const text = announceText({ ...input, summary: 'x'.repeat(500) }, { maxLength: 120 })
    expect(text).toContain('https://example.com/blog/my-post')
    expect(text.length).toBeLessThanOrEqual(120)
  })
})

describe('registry invariants', () => {
  it('every publishable provider defines publish(); link-only never does', () => {
    for (const p of listProviders()) {
      if (p.capability === 'linkOnly') expect(p.publish).toBeUndefined()
      else expect(typeof p.publish).toBe('function')
    }
  })
  it('has unique provider ids and resolves them', () => {
    const ids = listProviders().map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(getProvider('devto')?.name).toBe('DEV Community')
    expect(getProvider('nope')).toBeUndefined()
  })
  it('marks Medium, Instagram, TikTok, Substack as link-only (ban-safe)', () => {
    for (const id of ['medium', 'instagram', 'tiktok', 'substack', 'youtube']) {
      expect(getProvider(id)?.capability).toBe('linkOnly')
    }
  })
})

// safeFetch is referenced so the mock import is exercised even if unused above.
void mockSafeFetch
