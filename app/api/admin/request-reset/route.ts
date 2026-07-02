import { NextRequest, NextResponse } from 'next/server'
import { createResetToken, sendResetEmail } from '@/lib/admin-auth'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  // Per-IP and global caps: this endpoint emails the owner, so without a
  // global cap an attacker rotating IPs could flood the admin mailbox.
  const [ipOk, globalOk] = await Promise.all([
    rateLimit(`reset-req:${getClientIp(req)}`, 3, 60 * 60 * 1000),
    rateLimit('reset-req:global', 6, 60 * 60 * 1000),
  ])
  if (!ipOk || !globalOk) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  // Always return success to prevent email enumeration
  if (email !== process.env.ADMIN_EMAIL) {
    await new Promise((r) => setTimeout(r, 400))
    return NextResponse.json({ ok: true })
  }

  const token = await createResetToken()
  const baseUrl = req.nextUrl.origin

  try {
    await sendResetEmail(token, baseUrl)
  } catch (err) {
    console.error('Reset email failed:', err)
    return NextResponse.json({ error: 'Could not send reset email. Check email configuration.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
