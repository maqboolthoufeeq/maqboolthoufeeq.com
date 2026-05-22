import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  verifyAdminPassword,
  isBrowserTrusted,
  createOtp,
  createPreAuthToken,
  sendOtpEmail,
  BROWSER_COOKIE,
} from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }

  // Rate limiting: simple check — always validate email first
  if (email !== process.env.ADMIN_EMAIL) {
    // Deliberate same-looking delay to prevent email enumeration
    await new Promise((r) => setTimeout(r, 300))
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const valid = await verifyAdminPassword(password)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // Check if this browser is already trusted
  const jar = await cookies()
  const browserId = jar.get(BROWSER_COOKIE)?.value
  const trusted = await isBrowserTrusted(browserId)

  if (trusted) {
    // Browser is known — issue pre-auth token directly
    const preAuthToken = await createPreAuthToken()
    return NextResponse.json({ preAuthToken })
  }

  // New browser — send OTP (skip email in development)
  const otp = await createOtp()
  if (process.env.NODE_ENV !== 'development') {
    try {
      await sendOtpEmail(otp)
    } catch (err) {
      console.error('OTP email failed:', err)
      return NextResponse.json({ error: 'Could not send verification email. Check email configuration.' }, { status: 500 })
    }
  }

  return NextResponse.json({ requiresOtp: true })
}
