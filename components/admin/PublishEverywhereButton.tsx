'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import CrossPostModal from './CrossPostModal'

type ContentType = 'post' | 'hubItem' | 'hubTopic'

/**
 * Drop-in "Publish everywhere" trigger used on blog posts and hub items. Renders a
 * button (full or compact) that opens the cross-post modal for the given content.
 */
export default function PublishEverywhereButton({
  contentType,
  contentId,
  title,
  variant = 'detail',
}: {
  contentType: ContentType
  contentId: string
  title?: string
  variant?: 'detail' | 'compact'
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {variant === 'compact' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Publish everywhere"
          aria-label="Publish everywhere"
          className="h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-[12px] font-semibold text-violet-600 hover:bg-violet-500/10 transition-all"
        >
          <Sparkles size={12} /> Share
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
        >
          <Sparkles size={15} /> Publish everywhere
        </button>
      )}
      {open && <CrossPostModal contentType={contentType} contentId={contentId} title={title} onClose={() => setOpen(false)} />}
    </>
  )
}
