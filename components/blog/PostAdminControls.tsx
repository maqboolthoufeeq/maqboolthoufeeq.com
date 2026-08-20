'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import PublishEverywhereButton from '@/components/admin/PublishEverywhereButton'

type Props = {
  id: string
  title?: string
  /** 'card' = compact corner overlay on a list card; 'detail' = full toolbar on the post page. */
  variant?: 'card' | 'detail'
}

function useDelete(id: string, title: string | undefined, variant: 'card' | 'detail') {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function onDelete() {
    if (deleting) return
    const ok = window.confirm(
      `Delete this post permanently?${title ? `\n\n“${title}”` : ''}\n\nThis can’t be undone.`,
    )
    if (!ok) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error('delete failed')
      if (variant === 'detail') {
        router.push('/blog')
        router.refresh()
      } else {
        router.refresh()
      }
    } catch {
      setDeleting(false)
      window.alert('Could not delete the post. Please try again.')
    }
  }

  return { deleting, onDelete }
}

export default function PostAdminControls({ id, title, variant = 'card' }: Props) {
  const { deleting, onDelete } = useDelete(id, title, variant)
  const editHref = `/admin/posts/${id}/edit`

  if (variant === 'detail') {
    return (
      <div className="mb-8 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Admin
        </span>
        <Link
          href={editHref}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
        >
          <Pencil size={15} /> Edit
        </Link>
        <PublishEverywhereButton contentType="post" contentId={id} title={title} />
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
        >
          {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    )
  }

  // card variant — an inline bar at the bottom of the card. `relative z-20`
  // keeps it (and its buttons) above the card's full-card overlay link.
  return (
    <div className="relative z-20 mt-3 flex items-center gap-2 border-t border-[var(--border)] pt-3">
      <Link
        href={editHref}
        aria-label="Edit post"
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
      >
        <Pencil size={13} /> Edit
      </Link>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label="Delete post"
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
      >
        {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  )
}
