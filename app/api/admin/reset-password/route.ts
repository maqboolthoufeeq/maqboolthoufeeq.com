import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { consumeResetToken, updateAdminPassword } from '@/lib/admin-auth'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()

  if (!token || !password || typeof token !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  if (!(await rateLimit(`reset-pw:${getClientIp(req)}`, 5, 60 * 60 * 1000))) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  const valid = await consumeResetToken(token)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 401 })
  }

  await updateAdminPassword(password)

  // A reset implies the old password may be compromised: revoke every trusted
  // browser (forcing OTP on next login) and void outstanding OTP/pre-auth tokens.
  await Promise.all([
    prisma.adminBrowser.deleteMany({}),
    prisma.adminToken.deleteMany({ where: { type: { in: ['otp', 'preauth'] } } }),
  ]).catch((err) => console.error('[reset-password] revocation cleanup failed:', err))

  return NextResponse.json({ ok: true })
}
