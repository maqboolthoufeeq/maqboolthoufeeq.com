import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

/**
 * `pg-connection-string` logs a deprecation warning that the `sslmode` values
 * `require` / `prefer` / `verify-ca` are currently aliased to `verify-full`.
 * Make it explicit so the (identical, cert-verifying) behaviour is preserved
 * without the noisy warning. No-op for URLs that already use another mode.
 */
function normalizeSslMode(url: string): string {
  return url.replace(/(\bsslmode=)(require|prefer|verify-ca)\b/gi, '$1verify-full')
}

function createPrismaClient() {
  const connectionString = normalizeSslMode(process.env.DATABASE_URL ?? '')
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
