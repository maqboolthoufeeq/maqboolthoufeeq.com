'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * A modal confirmation dialog for destructive actions — replaces window.confirm
 * so deletes (especially bulk/cascading ones) require an explicit, clear choice.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onCancel() }
    window.addEventListener('keydown', onKey)
    const orig = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = orig
    }
  }, [open, busy, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={() => { if (!busy) onCancel() }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      aria-describedby="confirm-dialog-message"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          {danger && (
            <span className="shrink-0 w-10 h-10 rounded-full bg-red-500/15 text-red-500 flex items-center justify-center">
              <AlertTriangle size={20} />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="font-semibold text-[var(--foreground)]">{title}</h2>
            <div id="confirm-dialog-message" className="text-sm text-[var(--muted)] mt-1 leading-relaxed">{message}</div>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="tap-scale flex-1 h-11 rounded-xl border border-[var(--border)] text-[var(--foreground)] font-medium hover:bg-[var(--background)] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`tap-scale flex-1 h-11 rounded-xl font-semibold text-white disabled:opacity-50 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[var(--accent)] hover:opacity-90'
            }`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
