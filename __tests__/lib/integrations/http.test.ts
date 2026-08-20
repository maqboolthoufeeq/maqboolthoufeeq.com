import { assertSafeUrl, assertHostAllowed, extractApiError, IntegrationError } from '@/lib/integrations/http'

describe('assertSafeUrl (SSRF guard)', () => {
  it('allows public https URLs', () => {
    expect(() => assertSafeUrl('https://dev.to/api/articles')).not.toThrow()
    expect(assertSafeUrl('https://api.x.com/2/tweets').hostname).toBe('api.x.com')
  })

  it('rejects non-https schemes', () => {
    expect(() => assertSafeUrl('http://dev.to')).toThrow(IntegrationError)
    expect(() => assertSafeUrl('ftp://example.com')).toThrow()
  })

  it('rejects localhost and internal hostnames', () => {
    expect(() => assertSafeUrl('https://localhost/x')).toThrow()
    expect(() => assertSafeUrl('https://foo.local/x')).toThrow()
    expect(() => assertSafeUrl('https://svc.internal/x')).toThrow()
  })

  it('rejects private and reserved literal IPs', () => {
    expect(() => assertSafeUrl('https://127.0.0.1/x')).toThrow()
    expect(() => assertSafeUrl('https://10.0.0.5/x')).toThrow()
    expect(() => assertSafeUrl('https://192.168.1.1/x')).toThrow()
    expect(() => assertSafeUrl('https://169.254.169.254/latest')).toThrow() // cloud metadata
  })

  it('rejects an invalid URL', () => {
    expect(() => assertSafeUrl('not a url')).toThrow()
  })
})

describe('assertHostAllowed', () => {
  it('accepts an exact or suffix host match', () => {
    expect(() => assertHostAllowed(new URL('https://hooks.slack.com/services/x'), ['hooks.slack.com'])).not.toThrow()
    expect(() => assertHostAllowed(new URL('https://ptb.discord.com/api'), ['discord.com'])).not.toThrow()
  })
  it('rejects a non-allowed host', () => {
    expect(() => assertHostAllowed(new URL('https://evil.com/x'), ['discord.com'])).toThrow(IntegrationError)
  })
})

describe('extractApiError', () => {
  it('reads common error shapes', () => {
    expect(extractApiError({ error: 'bad key' })).toBe('bad key')
    expect(extractApiError({ message: 'nope' })).toBe('nope')
    expect(extractApiError({ error_description: 'invalid_grant' })).toBe('invalid_grant')
  })
  it('reads GraphQL errors[].message', () => {
    expect(extractApiError({ errors: [{ message: 'gql failed' }] })).toBe('gql failed')
  })
  it('falls back when nothing matches', () => {
    expect(extractApiError(null, 'fallback')).toBe('fallback')
    expect(extractApiError({ weird: true }, 'fallback')).toBe('fallback')
  })
})
