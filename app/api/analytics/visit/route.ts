import { NextRequest, NextResponse } from 'next/server'
import { recordVisit } from '@/lib/analytics'

const VISITOR_COOKIE = 'vid'
const ONE_YEAR = 60 * 60 * 24 * 365

/**
 * Beacon endpoint hit once per public page load. A browser without a visitor
 * cookie counts as a new unique visitor (and gets the cookie set); every hit
 * counts as a page view. Best-effort: failures never surface to the user.
 */
export async function POST(req: NextRequest) {
  const isUnique = !req.cookies.get(VISITOR_COOKIE)

  try {
    await recordVisit(isUnique)
  } catch (err) {
    console.error('POST /api/analytics/visit', err)
    return new NextResponse(null, { status: 204 })
  }

  const res = new NextResponse(null, { status: 204 })
  if (isUnique) {
    res.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: ONE_YEAR,
    })
  }
  return res
}
