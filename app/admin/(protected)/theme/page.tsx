import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { DEFAULT_THEME_ID } from '@/lib/themes'
import { DEFAULT_DESIGN_ID } from '@/lib/designs'
import { DEFAULT_TEMPLATE_ID } from '@/lib/templates'
import ThemePicker from '@/components/admin/ThemePicker'
import DesignPicker from '@/components/admin/DesignPicker'
import TemplatePicker from '@/components/admin/TemplatePicker'

export default async function ThemePage() {
  const [themeRow, designRow, templateRow] = await Promise.all([
    prisma.siteContent.findUnique({ where: { key: 'theme' } }),
    prisma.siteContent.findUnique({ where: { key: 'design' } }),
    prisma.siteContent.findUnique({ where: { key: 'template' } }),
  ])
  const activeThemeId = (themeRow?.value as { id?: string } | null)?.id ?? DEFAULT_THEME_ID
  const activeDesignId = (designRow?.value as { id?: string } | null)?.id ?? DEFAULT_DESIGN_ID
  const activeTemplateId = (templateRow?.value as { id?: string } | null)?.id ?? DEFAULT_TEMPLATE_ID

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] px-6 h-14 flex items-center gap-3">
        <Link href="/admin" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">← Admin</Link>
        <span className="text-[var(--border)]">/</span>
        <h1 className="font-semibold text-[var(--foreground)]">Theme & Design</h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-12">
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">Layout template</h2>
            <p className="text-sm text-[var(--muted)]">
              Choose a complete page layout. Each template has its own structure, fonts, and aesthetic.
            </p>
          </div>
          <TemplatePicker initialTemplateId={activeTemplateId} />
        </section>

        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">Colour theme</h2>
            <p className="text-sm text-[var(--muted)]">
              Clicking a theme applies it to your site instantly — no reload needed.
            </p>
          </div>
          <ThemePicker activeId={activeThemeId} />
        </section>

        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">Design style</h2>
            <p className="text-sm text-[var(--muted)]">
              Choose a visual style for the entire site. Each design completely changes the look and feel.
            </p>
          </div>
          <DesignPicker activeId={activeDesignId} />
        </section>
      </main>
    </div>
  )
}
