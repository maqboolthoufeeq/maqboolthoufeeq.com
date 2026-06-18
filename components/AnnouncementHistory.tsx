import Link from 'next/link'
import { Info, CheckCircle2, AlertTriangle, Megaphone, ArrowRight } from 'lucide-react'
import { isExternal } from '@/lib/utils'
import type { Banner, BannerVariant } from '@/lib/banner-types'

const VARIANT: Record<BannerVariant, { icon: typeof Info; iconCls: string; label: string }> = {
  info: { icon: Info, iconCls: 'text-[var(--accent)]', label: 'Notice' },
  success: { icon: CheckCircle2, iconCls: 'text-emerald-500', label: 'Update' },
  warning: { icon: AlertTriangle, iconCls: 'text-amber-500', label: 'Important' },
  announcement: { icon: Megaphone, iconCls: 'text-fuchsia-500', label: 'Announcement' },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * Public, chronological list of every announcement. Rendered on the
 * `/announcements` page and reusable anywhere a notice history is wanted.
 */
export default function AnnouncementHistory({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)] py-8 text-center">
        No announcements yet. Check back soon.
      </p>
    )
  }

  return (
    <ol className="relative border-l border-[var(--border)] ml-2 space-y-8">
      {banners.map((b) => {
        const style = VARIANT[b.variant] ?? VARIANT.info
        const Icon = style.icon
        const cta = b.linkUrl && b.linkLabel ? { url: b.linkUrl, label: b.linkLabel } : null
        return (
          <li key={b.id} className="ml-6">
            <span className="absolute -left-[9px] flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[var(--surface)] border border-[var(--border)]">
              <Icon size={11} className={style.iconCls} aria-hidden />
            </span>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold uppercase tracking-wide ${style.iconCls}`}>
                  {style.label}
                </span>
                {b.active && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                    Current
                  </span>
                )}
                <span className="ml-auto text-xs text-[var(--muted)]">{formatDate(b.createdAt)}</span>
              </div>
              <p className="text-sm sm:text-base text-[var(--foreground)] leading-relaxed">{b.message}</p>
              {cta &&
                (isExternal(cta.url) ? (
                  <a
                    href={cta.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-[var(--accent)] hover:underline"
                  >
                    {cta.label}
                    <ArrowRight size={14} />
                  </a>
                ) : (
                  <Link
                    href={cta.url}
                    className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-[var(--accent)] hover:underline"
                  >
                    {cta.label}
                    <ArrowRight size={14} />
                  </Link>
                ))}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
