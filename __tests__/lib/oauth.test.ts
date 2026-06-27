const mockCreate = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: { oAuthClient: { create: (...args: unknown[]) => mockCreate(...args) } },
}))

import { isSafeRedirectUri, isAllowedRedirectUri, registerOAuthClient } from '@/lib/oauth'

describe('isSafeRedirectUri', () => {
  it('accepts https URIs (e.g. claude.ai callback)', () => {
    expect(isSafeRedirectUri('https://claude.ai/api/mcp/auth_callback')).toBe(true)
  })

  it('accepts http only on loopback', () => {
    expect(isSafeRedirectUri('http://localhost:3456/callback')).toBe(true)
    expect(isSafeRedirectUri('http://127.0.0.1:3456/callback')).toBe(true)
  })

  it('rejects http on public hosts, custom schemes and garbage', () => {
    expect(isSafeRedirectUri('http://evil.example.com/cb')).toBe(false)
    expect(isSafeRedirectUri('com.evil.app://cb')).toBe(false)
    expect(isSafeRedirectUri('not a url')).toBe(false)
  })
})

describe('isAllowedRedirectUri', () => {
  it('requires an exact, pre-registered, safe match', () => {
    const registered = ['https://claude.ai/api/mcp/auth_callback']
    expect(isAllowedRedirectUri(registered, 'https://claude.ai/api/mcp/auth_callback')).toBe(true)
    expect(isAllowedRedirectUri(registered, 'https://claude.ai/api/mcp/auth_callback/')).toBe(false)
    expect(isAllowedRedirectUri([], 'https://claude.ai/api/mcp/auth_callback')).toBe(false)
  })
})

describe('registerOAuthClient', () => {
  beforeEach(() => {
    mockCreate.mockReset()
    mockCreate.mockResolvedValue({
      id: 'db1',
      name: 'claude.ai',
      clientId: 'mcp_abc',
      clientSecret: 'hashed',
      redirectUrls: ['https://claude.ai/api/mcp/auth_callback'],
      createdAt: new Date(),
    })
  })

  it('registers a client for a valid https redirect_uri', async () => {
    const client = await registerOAuthClient('claude.ai', ['https://claude.ai/api/mcp/auth_callback'])
    expect(client).not.toBeNull()
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('rejects empty or unsafe redirect_uris without touching the db', async () => {
    expect(await registerOAuthClient('x', [])).toBeNull()
    expect(await registerOAuthClient('x', ['http://evil.example.com/cb'])).toBeNull()
    expect(mockCreate).not.toHaveBeenCalled()
  })
})
