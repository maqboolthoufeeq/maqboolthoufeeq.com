import { NextRequest, NextResponse } from 'next/server'
import { consumeResetToken, updateAdminPassword } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()

  if (!token || !password || typeof token !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const valid = await consumeResetToken(token)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 401 })
  }

  await updateAdminPassword(password)
  return NextResponse.json({ ok: true })
}
