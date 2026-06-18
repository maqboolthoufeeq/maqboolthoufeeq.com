'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Info, CheckCircle2, AlertTriangle, Megaphone, ArrowRight, X } from 'lucide-react'
import { isExternal } from '@/lib/utils'
import type { Banner, BannerVariant } from '@/lib/banner-types'

const STORAGE_KEY = 'dismissed-banner'

const VARIANT: Record<BannerVariant, { icon: typeof Info; bar: string; iconCls: string; ring: string }> = {
  info: {
    icon: Info,
    bar: 'bg-[var(--accent)]/10 text-[var(--foreground)]',
    iconCls: 'text-[var(--accent)]',
    ring: 'border-[var(--accent)]/30',
  },
  success: {
    icon: CheckCircle2,
    bar: 'bg-emerald-500/10 text-[var(--foreground)]',
    iconCls: 'text-emerald-500',
    ring: 'border-emerald-500/30',
  },
  warning: {
    icon: AlertTriangle,
    bar: 'bg-amber-500/10 text-[var(--foreground)]',
    iconCls: 'text-amber-500',
    ring: 'border-amber-500/30',
  },
  announcement: {
    icon: Megaphone,
    bar: 'bg-fuchsia-500/10 text-[var(--foreground)]',
    iconCls: 'text-fuchsia-500',
    ring: 'border-fuchsia-500/30',
  },
}

export default function AnnouncementBar({
  banner,
  historyHref = '/announcements',
}: {
  banner: Banner
  historyHref?: string
}) {
  // Render nothing until we know whether this exact banner was dismissed, so the
  // server/client markup matches on first paint and there's no flash.
  const [ready, setReady] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== banner.id)
    } catch {
      setVisible(true)
    }
    setReady(true)
  }, [banner.id])

  function dismiss() {
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, banner.id)
    } catch {
      /* storage unavailable — dismiss for this session only */
    }
  }

  if (!ready || !visible) return null

  const style = VARIANT[banner.variant] ?? VARIANT.info
  const Icon = style.icon
  const cta = banner.linkUrl && banner.linkLabel ? { url: banner.linkUrl, label: banner.linkLabel } : null

  return (
    <div
      role="region"
      aria-label="Site announcement"
      className={`relative z-[60] border-b ${style.ring} ${style.bar}`}
    >
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <Icon size={18} className={`shrink-0 ${style.iconCls}`} aria-hidden />

        <p className="flex-1 min-w-0 text-sm leading-snug">
          <Link href={historyHref} className="font-semibold hover:underline underline-offset-2">
            Latest
          </Link>{' '}
          <span className="text-[var(--muted)]">·</span> <span>{banner.message}</span>
          {cta &&
            (isExternal(cta.url) ? (
              <a
                href={cta.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 ml-2 font-medium hover:underline underline-offset-2"
              >
                {cta.label}
                <ArrowRight size={14} />
              </a>
            ) : (
              <Link
                href={cta.url}
                className="inline-flex items-center gap-1 ml-2 font-medium hover:underline underline-offset-2"
              >
                {cta.label}
                <ArrowRight size={14} />
              </Link>
            ))}
        </p>

        <Link
          href={historyHref}
          className="hidden sm:inline text-xs text-[var(--muted)] hover:text-[var(--foreground)] whitespace-nowrap"
        >
          View all
        </Link>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="shrink-0 w-7 h-7 -mr-1 flex items-center justify-center rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
