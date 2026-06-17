import nodemailer from 'nodemailer'

interface EmailPayload {
  to: string
  subject: string
  html: string
}

// Returns true only when real (non-placeholder) SMTP credentials are present
function smtpConfigured(): boolean {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return false
  // Skip obvious placeholder values copied from .env.example
  if (SMTP_USER.includes('your@') || SMTP_PASS === 'your-app-password') return false
  return true
}

function mailgunConfigured(): boolean {
  const { MAILGUN_API_KEY, MAILGUN_DOMAIN } = process.env
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) return false
  // MAILGUN_DOMAIN must be just a domain name (e.g. mg.example.com), not a URL
  if (MAILGUN_DOMAIN.startsWith('http')) return false
  return true
}

async function sendViaSMTP(payload: EmailPayload): Promise<void> {
  const host = process.env.SMTP_HOST ?? ''
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10)
  const user = process.env.SMTP_USER ?? ''
  const pass = process.env.SMTP_PASS ?? ''
  const from = process.env.SMTP_FROM ?? user

  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
  await transporter.sendMail({ from, to: payload.to, subject: payload.subject, html: payload.html })
}

async function sendViaMailgun(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.MAILGUN_API_KEY ?? ''
  const domain = process.env.MAILGUN_DOMAIN ?? ''
  const from = process.env.MAILGUN_FROM ?? `noreply@${domain}`

  // Auto-detect EU region if not explicitly set
  const isEu = process.env.MAILGUN_REGION === 'eu'
  const base = isEu
    ? `https://api.eu.mailgun.net/v3/${domain}/messages`
    : `https://api.mailgun.net/v3/${domain}/messages`

  const body = new URLSearchParams({ from, to: payload.to, subject: payload.subject, html: payload.html })

  const res = await fetch(base, {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}` },
    body,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Mailgun responded ${res.status}: ${text}`)
  }
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  // Defense-in-depth: collapse CR/LF in the subject so any user-supplied value
  // that reaches it (e.g. the contact-form name) can never inject SMTP headers.
  payload = { ...payload, subject: payload.subject.replace(/[\r\n]+/g, ' ') }

  const hasSMTP = smtpConfigured()
  const hasMailgun = mailgunConfigured()

  if (!hasSMTP && !hasMailgun) {
    throw new Error('No email provider configured. Set SMTP or Mailgun env vars.')
  }

  // Try SMTP first if configured
  if (hasSMTP) {
    const err: unknown = await sendViaSMTP(payload).then(() => null).catch((e) => e)
    if (!err) return
    console.error('[email] SMTP failed:', err instanceof Error ? err.message : err)
    if (!hasMailgun) throw err as Error
    console.info('[email] Falling back to Mailgun…')
  }

  // Try Mailgun
  if (hasMailgun) {
    await sendViaMailgun(payload)
  }
}
