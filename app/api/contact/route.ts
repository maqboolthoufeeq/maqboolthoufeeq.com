import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { uploadContactAttachment } from '@/lib/blob'

const IP_LIMIT = 5        // max per IP per hour
const SESSION_LIMIT = 2   // max per session cookie
const SESSION_COOKIE = 'contact_count'

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const message = String(formData.get('message') ?? '').trim()
  const file = formData.get('attachment')

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }
  if (message.length < 10) {
    return NextResponse.json({ error: 'Message is too short (min 10 characters)' }, { status: 400 })
  }
  if (name.length > 100 || email.length > 254 || message.length > 2000) {
    return NextResponse.json({ error: 'Input exceeds maximum length' }, { status: 400 })
  }

  // Session-based rate limit
  const jar = await cookies()
  const sessionCount = parseInt(jar.get(SESSION_COOKIE)?.value ?? '0', 10)
  if (sessionCount >= SESSION_LIMIT) {
    return NextResponse.json(
      { error: 'You have already submitted a message. Please try again later.' },
      { status: 429 },
    )
  }

  // IP-based rate limit
  const ip = getIp(req)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentCount = await prisma.contactRequest.count({
    where: { ip, createdAt: { gte: oneHourAgo } },
  })
  if (recentCount >= IP_LIMIT) {
    return NextResponse.json(
      { error: 'Too many requests from your network. Please try again later.' },
      { status: 429 },
    )
  }

  // Handle optional attachment
  let attachmentUrl: string | undefined
  let attachmentName: string | undefined

  if (file instanceof File && file.size > 0) {
    try {
      attachmentUrl = await uploadContactAttachment(file)
      attachmentName = file.name
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      return NextResponse.json({ error: msg }, { status: 400 })
    }
  }

  await prisma.contactRequest.create({
    data: { name, email, message, ip, attachmentUrl, attachmentName },
  })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, String(sessionCount + 1), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60,
    path: '/',
  })

  const adminEmail = process.env.ADMIN_EMAIL ?? ''
  sendEmail({
    to: adminEmail,
    subject: `New contact request from ${name}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
        <h2 style="margin:0 0 8px;color:#111">New contact request</h2>
        <p style="color:#6b7280;margin:0 0 24px">Someone submitted the contact form on your site.</p>
        <table style="width:100%;border-collapse:collapse;font-size:15px">
          <tr>
            <td style="padding:10px 0;color:#6b7280;width:80px;vertical-align:top">Name</td>
            <td style="padding:10px 0;font-weight:600;color:#111">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#6b7280;vertical-align:top">Email</td>
            <td style="padding:10px 0">
              <a href="mailto:${escapeHtml(email)}" style="color:#7c3aed">${escapeHtml(email)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#6b7280;vertical-align:top">Message</td>
            <td style="padding:10px 0;color:#111;white-space:pre-wrap">${escapeHtml(message)}</td>
          </tr>
          ${attachmentUrl ? `
          <tr>
            <td style="padding:10px 0;color:#6b7280;vertical-align:top">Attachment</td>
            <td style="padding:10px 0">
              <a href="${attachmentUrl}" style="color:#7c3aed">${escapeHtml(attachmentName ?? 'Download file')}</a>
            </td>
          </tr>
          ` : ''}
        </table>
        <p style="color:#9ca3af;font-size:13px;margin-top:24px">
          View all messages in the <a href="${req.nextUrl.origin}/admin/contact" style="color:#7c3aed">admin panel</a>.
        </p>
      </div>
    `,
  }).catch((err) => console.error('[contact] Email notification failed:', err))

  return res
}
