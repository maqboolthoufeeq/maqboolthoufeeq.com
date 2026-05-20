import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import {
  verifyOtp,
  trustBrowser,
  createPreAuthToken,
  BROWSER_COOKIE,
  BROWSER_COOKIE_MAX_AGE,
} from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const { code } = await req.json()

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  const valid = await verifyOtp(code.trim())
  if (!valid) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 })
  }

  // Generate a new browser ID and trust it
  const jar = await cookies()
  let browserId = jar.get(BROWSER_COOKIE)?.value
  if (!browserId) {
    browserId = crypto.randomBytes(32).toString('hex')
  }
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
