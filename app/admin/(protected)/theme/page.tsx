import { prisma } from '@/lib/prisma'
import { DEFAULT_THEME_ID } from '@/lib/themes'
import { DEFAULT_DESIGN_ID } from '@/lib/designs'
import { DEFAULT_TEMPLATE_ID } from '@/lib/templates'
import ThemePicker from '@/components/admin/ThemePicker'
import DesignPicker from '@/components/admin/DesignPicker'
import TemplatePicker from '@/components/admin/TemplatePicker'
import AdminShell from '@/components/admin/AdminShell'

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
    <AdminShell title="Theme & design" back="/admin">
      <div className="space-y-10 sm:space-y-12">
        <section>
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-1">
              Layout template
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Choose a complete page layout. Each template has its own structure, fonts, and
              aesthetic.
            </p>
          </div>
          <TemplatePicker initialTemplateId={activeTemplateId} />
        </section>

        <section>
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-1">
              Colour theme
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Tap a theme to apply it instantly — no reload needed.
            </p>
          </div>
          <ThemePicker activeId={activeThemeId} />
        </section>

        <section>
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-1">
              Design style
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Each design completely changes the look and feel of your site.
            </p>
          </div>
          <DesignPicker activeId={activeDesignId} />
        </section>
      </div>
    </AdminShell>
  )
}
