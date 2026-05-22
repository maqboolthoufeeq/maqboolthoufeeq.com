import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { sendEmail } from './email'

// ─── Password ─────────────────────────────────────────────────────────────────

export async function verifyAdminPassword(password: string): Promise<boolean> {
  // Check DB first (set via forgot-password flow), then fall back to env vars
  const settings = await prisma.adminSettings.findUnique({ where: { id: 'singleton' } }).catch(() => null)
  if (settings?.passwordHash) {
    return bcrypt.compare(password, settings.passwordHash)
  }
  const hash = process.env.ADMIN_PASSWORD_HASH
  if (hash) return bcrypt.compare(password, hash)
  return password === process.env.ADMIN_PASSWORD
}

export async function updateAdminPassword(newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(newPassword, 12)
  await prisma.adminSettings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', passwordHash: hash },
    update: { passwordHash: hash },
  })
}

// ─── Browser trust ─────────────────────────────────────────────────────────────

export const BROWSER_COOKIE = 'admin_bid'
export const BROWSER_COOKIE_MAX_AGE = 60 * 60 * 24 * 90 // 90 days

export async function isBrowserTrusted(browserId: string | undefined): Promise<boolean> {
  if (!browserId) return false
  const row = await prisma.adminBrowser.findUnique({ where: { browserId } }).catch(() => null)
  if (!row) return false
  await prisma.adminBrowser.update({ where: { browserId }, data: { lastUsed: new Date() } }).catch(() => null)
  return true
}

export async function trustBrowser(browserId: string): Promise<void> {
  await prisma.adminBrowser.upsert({
    where: { browserId },
    create: { browserId },
    update: { lastUsed: new Date() },
  })
}

// ─── OTP ──────────────────────────────────────────────────────────────────────

export async function createOtp(): Promise<string> {
  const otp = process.env.NODE_ENV === 'development' ? '123456' : String(crypto.randomInt(100000, 999999))
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min

  // Invalidate any existing unused OTPs
  await prisma.adminToken.updateMany({ where: { type: 'otp', used: false }, data: { used: true } })
  await prisma.adminToken.create({ data: { token: otp, type: 'otp', expiresAt } })
  return otp
}

export async function verifyOtp(code: string): Promise<boolean> {
  const row = await prisma.adminToken.findFirst({
    where: { token: code, type: 'otp', used: false, expiresAt: { gt: new Date() } },
  })
  if (!row) return false
  await prisma.adminToken.update({ where: { id: row.id }, data: { used: true } })
  return true
}

// ─── Pre-auth token (short-lived, consumed by NextAuth) ───────────────────────

export async function createPreAuthToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 min
  await prisma.adminToken.create({ data: { token, type: 'preauth', expiresAt } })
  return token
}

export async function verifyPreAuthToken(token: string): Promise<boolean> {
  const row = await prisma.adminToken.findFirst({
    where: { token, type: 'preauth', used: false, expiresAt: { gt: new Date() } },
  })
  if (!row) return false
  await prisma.adminToken.update({ where: { id: row.id }, data: { used: true } })
  return true
}

// ─── Password reset ───────────────────────────────────────────────────────────

export async function createResetToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await prisma.adminToken.updateMany({ where: { type: 'reset', used: false }, data: { used: true } })
  await prisma.adminToken.create({ data: { token, type: 'reset', expiresAt } })
  return token
}

export async function verifyResetToken(token: string): Promise<boolean> {
  const row = await prisma.adminToken.findFirst({
    where: { token, type: 'reset', used: false, expiresAt: { gt: new Date() } },
  })
  return !!row
}

export async function consumeResetToken(token: string): Promise<boolean> {
  const row = await prisma.adminToken.findFirst({
    where: { token, type: 'reset', used: false, expiresAt: { gt: new Date() } },
  })
  if (!row) return false
  await prisma.adminToken.update({ where: { id: row.id }, data: { used: true } })
  return true
}

// ─── Email templates ──────────────────────────────────────────────────────────

export async function sendOtpEmail(otp: string): Promise<void> {
  const to = process.env.ADMIN_EMAIL!
  await sendEmail({
    to,
    subject: 'Admin login verification code',
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px">
        <h2 style="margin:0 0 8px">Verification code</h2>
        <p style="color:#6b7280;margin:0 0 24px">Enter this code to complete your login. It expires in 10 minutes.</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#7c3aed;padding:16px 0">${otp}</div>
        <p style="color:#9ca3af;font-size:13px;margin-top:24px">If you didn't attempt to log in, you can ignore this email.</p>
      </div>
    `,
  })
}

export async function sendResetEmail(token: string, baseUrl: string): Promise<void> {
  const to = process.env.ADMIN_EMAIL!
  const url = `${baseUrl}/admin/reset-password?token=${token}`
  await sendEmail({
    to,
    subject: 'Admin password reset',
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px">
        <h2 style="margin:0 0 8px">Reset your password</h2>
        <p style="color:#6b7280;margin:0 0 24px">Click the link below to set a new admin password. The link expires in 1 hour.</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Reset password</a>
        <p style="color:#9ca3af;font-size:13px;margin-top:24px">If you didn't request a reset, you can ignore this email.</p>
      </div>
    `,
  })
}
