import { encryptSecret, decryptSecret, encryptJson, decryptJson, maskSecret, isEncryptionConfigured } from '@/lib/integrations/crypto'

// The key is derived lazily + cached on first use, so set AUTH_SECRET before any call.
beforeAll(() => {
  process.env.AUTH_SECRET = 'test-auth-secret-for-integration-crypto-0123456789'
})

describe('integration credential crypto (AES-256-GCM)', () => {
  it('round-trips a string', () => {
    const plain = 'super-secret-api-key-12345'
    const enc = encryptSecret(plain)
    expect(enc).not.toContain(plain)
    expect(enc.startsWith('v1:')).toBe(true)
    expect(decryptSecret(enc)).toBe(plain)
  })

  it('produces a different ciphertext each time (random IV)', () => {
    const a = encryptSecret('same-value')
    const b = encryptSecret('same-value')
    expect(a).not.toBe(b)
    expect(decryptSecret(a)).toBe('same-value')
    expect(decryptSecret(b)).toBe('same-value')
  })

  it('round-trips a JSON credentials object', () => {
    const creds = { apiKey: 'abc', publicationId: 'pub_1', nested: 'x' }
    const enc = encryptJson(creds)
    expect(decryptJson(enc)).toEqual(creds)
  })

  it('fails closed on a tampered ciphertext (GCM auth tag)', () => {
    const enc = encryptSecret('tamper-me')
    const parts = enc.split(':')
    // Flip a character in the ciphertext segment.
    parts[3] = parts[3].slice(0, -1) + (parts[3].slice(-1) === 'A' ? 'B' : 'A')
    expect(() => decryptSecret(parts.join(':'))).toThrow()
    // decryptJson swallows the throw and returns null rather than corrupt data.
    expect(decryptJson(parts.join(':'))).toBeNull()
  })

  it('rejects a malformed / wrong-version payload', () => {
    expect(() => decryptSecret('garbage')).toThrow()
    expect(() => decryptSecret('v2:a:b:c')).toThrow()
    expect(decryptJson(null)).toBeNull()
    expect(decryptJson('')).toBeNull()
  })

  it('masks secrets keeping only the tail', () => {
    expect(maskSecret('abcdef1234')).toMatch(/1234$/)
    expect(maskSecret('abcdef1234')).toContain('•')
    expect(maskSecret('xy')).toBe('••')
    expect(maskSecret('')).toBe('')
  })

  it('reports encryption configured when a secret is present', () => {
    expect(isEncryptionConfigured()).toBe(true)
  })
})
