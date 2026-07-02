import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import {
  verifyOtp,
  trustBrowser,
  createPreAuthToken,
  BROWSER_COOKIE,
  BROWSER_COOKIE_MAX_AGE,
} from '@/lib/admin-auth'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const { code } = await req.json()

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  // Per-IP cap on top of the per-code attempt counter inside verifyOtp.
  if (!(await rateLimit(`otp:${getClientIp(req)}`, 10, 15 * 60 * 1000))) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  const valid = await verifyOtp(code.trim())
  if (!valid) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 })
  }

  // Always mint a fresh browser ID rather than trusting whatever value the
  // request carried (avoids an attacker-fixated cookie value becoming trusted).
  const browserId = crypto.randomBytes(32).toString('hex')
  await trustBrowser(browserId)

  // Set the browser trust cookie
  const res = NextResponse.json({ preAuthToken: await createPreAuthToken() })
  res.cookies.set(BROWSER_COOKIE, browserId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: BROWSER_COOKIE_MAX_AGE,
    path: '/',
  })
  return res
}
