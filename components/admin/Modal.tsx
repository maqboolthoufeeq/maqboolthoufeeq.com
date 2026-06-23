'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * A generic, scrollable modal dialog: backdrop click + Escape close it, body
 * scroll is locked while open, and the panel scrolls internally for tall forms.
 * Used for inline "add content block / subtopic" flows on the admin hub list.
 */
export default function Modal({
  open,
  title,
  onClose,
  size = 'lg',
  children,
}: {
  open: boolean
  title: React.ReactNode
  onClose: () => void
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const orig = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = orig
    }
  }, [open, onClose])

  if (!open) return null

  const maxW = size === 'sm' ? 'max-w-sm' : size === 'md' ? 'max-w-md' : 'max-w-2xl'

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${maxW} my-4 flex flex-col max-h-[calc(100vh-2rem)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)] shrink-0">
          <h2 className="font-semibold text-[var(--foreground)] truncate">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="tap-scale shrink-0 w-9 h-9 -mr-1.5 flex items-center justify-center rounded-xl text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}
