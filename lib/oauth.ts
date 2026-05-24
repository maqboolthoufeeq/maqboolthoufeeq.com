import { randomBytes } from 'crypto'
import { prisma } from './prisma'

const CODE_TTL_MS = 10 * 60 * 1000       // 10 minutes
const TOKEN_TTL_MS = 365 * 24 * 3600 * 1000 // 1 year

function generate(bytes = 32) {
  return randomBytes(bytes).toString('hex')
}

export async function createOAuthClient(name: string, redirectUrls: string[]) {
  const clientId = generate(16)
  const clientSecret = generate(32)
  return prisma.oAuthClient.create({
    data: { name, clientId, clientSecret, redirectUrls },
  })
}

export async function listOAuthClients() {
  return prisma.oAuthClient.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, clientId: true, redirectUrls: true, createdAt: true },
  })
}

export async function deleteOAuthClient(id: string) {
  return prisma.oAuthClient.delete({ where: { id } })
}

export async function createAuthCode(clientId: string, redirectUrl: string) {
  const code = generate(32)
  await prisma.oAuthAuthCode.create({
    data: {
      code,
      clientId,
      redirectUrl,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  })
  return code
}

export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<string | null> {
  const authCode = await prisma.oAuthAuthCode.findUnique({
    where: { code },
    include: { client: true },
  })

  if (!authCode) return null
  if (authCode.used) return null
  if (authCode.expiresAt < new Date()) return null
  if (authCode.client.clientId !== clientId) return null
  if (authCode.client.clientSecret !== clientSecret) return null
  if (authCode.redirectUrl !== redirectUri) return null

  await prisma.oAuthAuthCode.update({ where: { code }, data: { used: true } })

  const token = generate(48)
  await prisma.oAuthAccessToken.create({
    data: {
      token,
      clientId: authCode.clientId,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  })
  return token
}

export async function validateAccessToken(token: string): Promise<boolean> {
  const record = await prisma.oAuthAccessToken.findUnique({ where: { token } })
  if (!record) return false
  if (record.expiresAt < new Date()) return false
  return true
}

export async function getClientByClientId(clientId: string) {
  return prisma.oAuthClient.findUnique({ where: { clientId } })
}
