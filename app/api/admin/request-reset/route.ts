import { NextRequest, NextResponse } from 'next/server'
import { createResetToken, sendResetEmail } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

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
