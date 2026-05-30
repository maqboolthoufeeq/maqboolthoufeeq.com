'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2, Loader2 } from 'lucide-react'

type Props = {
  id: string
  title?: string
}

/**
 * Inline Edit / Delete bar shown on a project card to logged-in admins. Mirrors
 * the blog PostAdminControls 'card' variant. Buttons stopPropagation so a click
 * on them never opens the project detail modal behind them.
 */
export default function ProjectAdminControls({ id, title }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const editHref = `/admin/projects/${id}/edit`

  async function onDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (deleting) return
    const ok = window.confirm(
      `Delete this project permanently?${title ? `\n\n“${title}”` : ''}\n\nThis can’t be undone.`,
    )
    if (!ok) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error('delete failed')
      router.refresh()
    } catch {
      setDeleting(false)
      window.alert('Could not delete the project. Please try again.')
    }
  }

  return (
    <div
      className="relative z-20 mt-3 flex items-center gap-2 border-t border-[var(--border)] pt-3"
      onClick={(e) => e.stopPropagation()}
    >
      <Link
        href={editHref}
        aria-label="Edit project"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
      >
        <Pencil size={13} /> Edit
      </Link>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label="Delete project"
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
      >
        {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  )
}
