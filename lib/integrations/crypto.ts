import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

/**
 * Reversible at-rest encryption for outbound integration credentials.
 *
 * Unlike the OAuth bearer secrets (which are high-entropy and only ever need to be
 * *verified*, so they're SHA-256 hashed — see lib/oauth.ts), these credentials must be
 * *sent* to third-party APIs (a dev.to api-key, a Telegram bot token, a webhook URL).
 * That requires authenticated, reversible encryption, so we use AES-256-GCM:
 *
 *   - GCM gives confidentiality AND integrity — a tampered ciphertext fails to decrypt
 *     rather than silently returning corrupted bytes.
 *   - A fresh random 96-bit IV per encryption (never reused with the same key).
 *   - The stored value is versioned so the scheme can evolve: `v1:<iv>:<tag>:<data>`,
 *     each part base64url. A DB leak alone exposes nothing usable without the key.
 *
 * Key material, in order of preference:
 *   1. INTEGRATIONS_ENC_KEY — a dedicated 32-byte key, base64 or hex (recommended in prod).
 *   2. Derived from AUTH_SECRET via scrypt — so the feature works out-of-the-box wherever
 *      NextAuth is already configured, with no extra setup.
 * If neither is present, encryption throws loudly rather than persisting plaintext.
 */

const VERSION = 'v1'
const ALGO = 'aes-256-gcm'
const IV_BYTES = 12 // 96-bit nonce, the GCM-recommended size
const KEY_BYTES = 32 // AES-256
// Fixed, non-secret domain-separation salt for the scrypt fallback. The secret is
// AUTH_SECRET; the salt only needs to be stable and distinct from other derivations.
const SCRYPT_SALT = 'maqbool.site/integrations/v1'

let cachedKey: Buffer | null = null

function decodeKeyMaterial(raw: string): Buffer | null {
  const trimmed = raw.trim()
  // Accept a 64-char hex key or a base64/base64url 32-byte key.
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) return Buffer.from(trimmed, 'hex')
  try {
    const buf = Buffer.from(trimmed, 'base64')
    if (buf.length === KEY_BYTES) return buf
  } catch {
    /* fall through */
  }
  return null
}

function getKey(): Buffer {
  if (cachedKey) return cachedKey

  const explicit = process.env.INTEGRATIONS_ENC_KEY
  if (explicit) {
    const key = decodeKeyMaterial(explicit)
    if (!key) {
      throw new Error('INTEGRATIONS_ENC_KEY must be a 32-byte key (hex or base64)')
    }
    cachedKey = key
    return key
  }

  const authSecret = process.env.AUTH_SECRET
  if (authSecret && authSecret.length > 0) {
    cachedKey = scryptSync(authSecret, SCRYPT_SALT, KEY_BYTES)
    return cachedKey
  }

  throw new Error(
    'No encryption key available: set INTEGRATIONS_ENC_KEY or AUTH_SECRET before storing integration credentials.',
  )
}

/** True when a key is configured — lets callers fail fast with a friendly message. */
export function isEncryptionConfigured(): boolean {
  try {
    getKey()
    return true
  } catch {
    return false
  }
}

/** Encrypt a UTF-8 string into the portable `v1:iv:tag:data` envelope. */
export function encryptSecret(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGO, key, iv)
  const data = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), data.toString('base64url')].join(':')
}

/**
 * Decrypt a `v1:iv:tag:data` envelope back to the original string. Throws if the
 * envelope is malformed, the version is unknown, or the authentication tag fails
 * (tampering / wrong key) — callers treat any throw as "credential unavailable".
 */
export function decryptSecret(payload: string): string {
  const parts = payload.split(':')
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error('Malformed encrypted payload')
  }
  const [, ivB64, tagB64, dataB64] = parts
  const key = getKey()
  const iv = Buffer.from(ivB64, 'base64url')
  const tag = Buffer.from(tagB64, 'base64url')
  const data = Buffer.from(dataB64, 'base64url')
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

/** Encrypt an arbitrary JSON-serialisable credentials object. */
export function encryptJson(value: unknown): string {
  return encryptSecret(JSON.stringify(value))
}

/** Decrypt back into a typed object. Returns null on any failure (never throws to callers). */
export function decryptJson<T = Record<string, unknown>>(payload: string | null | undefined): T | null {
  if (!payload) return null
  try {
    return JSON.parse(decryptSecret(payload)) as T
  } catch {
    return null
  }
}

/** Mask a secret for display: keep the last `keep` chars, e.g. "••••••3f9a". */
export function maskSecret(secret: string, keep = 4): string {
  const s = secret.trim()
  if (!s) return ''
  if (s.length <= keep) return '•'.repeat(s.length)
  return '•'.repeat(Math.min(8, s.length - keep)) + s.slice(-keep)
}
