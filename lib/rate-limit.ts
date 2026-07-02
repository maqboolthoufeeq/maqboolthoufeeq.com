import { NextRequest } from 'next/server'
import { prisma } from './prisma'

/**
 * Fixed-window, database-backed rate limiter for the low-volume sensitive
 * endpoints (login, OTP, password reset). A single atomic upsert either starts
 * a fresh window or increments the current one, so concurrent requests can't
 * slip past the cap. At this traffic level a DB round-trip per attempt is
 * cheaper and simpler than adding Redis.
 *
 * Fails OPEN on database errors: a transient outage must never lock the owner
 * out of their own admin login (the endpoints still require credentials).
 */
export async function rateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, now() + make_interval(secs => ${windowMs / 1000}))
      ON CONFLICT ("key") DO UPDATE SET
        "count"   = CASE WHEN "RateLimit"."resetAt" <= now() THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= now() THEN EXCLUDED."resetAt" ELSE "RateLimit"."resetAt" END
      RETURNING "count"
    `
    const count = rows[0]?.count ?? 1

    // Opportunistic cleanup so abandoned windows (one row per IP) never pile up.
    prisma.rateLimit
      .deleteMany({ where: { resetAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
      .catch(() => {})

    return count <= max
  } catch (err) {
    console.error('[rate-limit]', err)
    return true
  }
}

/** Client IP for rate-limit keys. On Vercel x-forwarded-for is platform-set. */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}
