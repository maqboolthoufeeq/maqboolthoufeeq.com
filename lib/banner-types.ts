// Pure, dependency-free banner types, constants and validation. Kept separate
// from `lib/banners.ts` (which imports Prisma) so client components can import
// the types/constants without dragging the database client into the browser
// bundle.

export const BANNER_VARIANTS = ['info', 'success', 'warning', 'announcement'] as const
export type BannerVariant = (typeof BANNER_VARIANTS)[number]

export interface Banner {
  id: string
  message: string
  linkLabel: string | null
  linkUrl: string | null
  variant: BannerVariant
  active: boolean
  createdAt: string
  updatedAt: string
}

const MAX_MESSAGE = 280
const MAX_LABEL = 60
const MAX_URL = 2048

/** Accept http(s), mailto, tel or a site-relative path; reject everything else. */
export function isSafeBannerUrl(url: string): boolean {
  if (url.startsWith('/') && !url.startsWith('//')) return true
  try {
    const u = new URL(url)
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(u.protocol)
  } catch {
    return false
  }
}

export function normalizeVariant(value: unknown): BannerVariant {
  return BANNER_VARIANTS.includes(value as BannerVariant) ? (value as BannerVariant) : 'info'
}

export interface BannerInput {
  message?: unknown
  linkLabel?: unknown
  linkUrl?: unknown
  variant?: unknown
  active?: unknown
}

export interface CleanBanner {
  message: string
  linkLabel: string | null
  linkUrl: string | null
  variant: BannerVariant
  active: boolean
}

/**
 * Validate + normalise a banner payload. Returns either a cleaned record ready
 * for Prisma or a human-readable error. `partial` skips the required-message
 * check so PATCH can update a single field.
 */
export function validateBanner(
  input: BannerInput,
  { partial = false }: { partial?: boolean } = {},
): { error: string } | { data: Partial<CleanBanner> } {
  const data: Partial<CleanBanner> = {}

  if (input.message !== undefined || !partial) {
    const message = typeof input.message === 'string' ? input.message.trim() : ''
    if (!message) return { error: 'Message is required' }
    if (message.length > MAX_MESSAGE) return { error: `Message must be ${MAX_MESSAGE} characters or fewer` }
    data.message = message
  }

  if (input.linkLabel !== undefined) {
    const label = typeof input.linkLabel === 'string' ? input.linkLabel.trim() : ''
    if (label.length > MAX_LABEL) return { error: `Button label must be ${MAX_LABEL} characters or fewer` }
    data.linkLabel = label || null
  }

  if (input.linkUrl !== undefined) {
    const url = typeof input.linkUrl === 'string' ? input.linkUrl.trim() : ''
    if (url) {
      if (url.length > MAX_URL) return { error: 'Button link is too long' }
      if (!isSafeBannerUrl(url)) return { error: 'Button link must be an http(s), mailto, tel or /path link' }
    }
    data.linkUrl = url || null
  }

  if (input.variant !== undefined) data.variant = normalizeVariant(input.variant)
  if (input.active !== undefined) data.active = Boolean(input.active)

  return { data }
}
