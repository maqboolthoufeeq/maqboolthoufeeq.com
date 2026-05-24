import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { listTokens, listOAuthClients } from '@/lib/oauth'
import { prisma } from '@/lib/prisma'
import McpPanel from '@/components/admin/McpPanel'

async function getDisabledTools(): Promise<string[]> {
  const row = await prisma.siteContent.findUnique({ where: { key: 'mcp_config' } })
  const cfg = (row?.value ?? {}) as { disabledTools?: string[] }
  return cfg.disabledTools ?? []
}

export default async function McpAdminPage() {
  const session = await auth()
  if (!session) redirect('/admin/login')

  const [rawTokens, rawClients, disabledTools] = await Promise.all([
    listTokens(),
    listOAuthClients(),
    getDisabledTools(),
  ])

  const tokens = rawTokens.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    expiresAt: t.expiresAt.toISOString(),
  }))

  const clients = rawClients.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }))

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] px-6 h-14 flex items-center gap-3">
        <Link href="/admin" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          Admin
        </Link>
        <span className="text-[var(--border)]">/</span>
        <h1 className="text-sm font-semibold text-[var(--foreground)]">MCP</h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <McpPanel tokens={tokens} clients={clients} disabledTools={disabledTools} />
      </main>
    </div>
  )
}
