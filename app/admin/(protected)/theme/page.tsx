import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { DEFAULT_THEME_ID } from '@/lib/themes'
import ThemePicker from '@/components/admin/ThemePicker'

export default async function ThemePage() {
  const row = await prisma.siteContent.findUnique({ where: { key: 'theme' } })
  const activeId = (row?.value as { id?: string } | null)?.id ?? DEFAULT_THEME_ID

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] px-6 h-14 flex items-center gap-3">
        <Link href="/admin" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">← Admin</Link>
        <span className="text-[var(--border)]">/</span>
        <h1 className="font-semibold text-[var(--foreground)]">Theme</h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">Choose a theme</h2>
          <p className="text-sm text-[var(--muted)]">
            Clicking a theme applies it to your site instantly — no reload needed.
          </p>
        </div>

        <ThemePicker activeId={activeId} />
      </main>
    </div>
  )
}
