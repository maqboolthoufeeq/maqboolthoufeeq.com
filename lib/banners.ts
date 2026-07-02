import { cache } from 'react'
import { prisma } from './prisma'
import { type Banner, normalizeVariant } from './banner-types'

// Database layer for the announcement / "latest" banner. Pure types, constants
// and validation live in `lib/banner-types.ts` (safe to import from client
// components); this module adds the Prisma queries on top.

export {
  BANNER_VARIANTS,
  type BannerVariant,
  type Banner,
  type BannerInput,
  type CleanBanner,
  isSafeBannerUrl,
  validateBanner,
} from './banner-types'

type BannerRow = {
  id: string
  message: string
  linkLabel: string | null
  linkUrl: string | null
  variant: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

function serialize(row: BannerRow): Banner {
  return {
    id: row.id,
    message: row.message,
    linkLabel: row.linkLabel,
    linkUrl: row.linkUrl,
    variant: normalizeVariant(row.variant),
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

/** The single banner shown at the top of the site: newest active one, or null.
 *  Deduped per request — layout and template can both ask without a second query. */
export const getActiveBanner = cache(async (): Promise<Banner | null> => {
  const row = await prisma.banner.findFirst({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
  })
  return row ? serialize(row) : null
})

/** Full announcement history (newest first) for the public + admin history views. */
export async function getBanners(): Promise<Banner[]> {
  const rows = await prisma.banner.findMany({ orderBy: { createdAt: 'desc' } })
  return rows.map(serialize)
}
