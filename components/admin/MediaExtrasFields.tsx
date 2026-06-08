'use client'

import { useRef, useState } from 'react'
import { X, Upload, Loader2, FileText, Film, File as FileIcon, Plus, Music } from 'lucide-react'
import { type MediaLink, type MediaAttachment, attachmentKind, formatBytes } from '@/lib/social'

const inputCls =
  'w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm'

// UX hint only — the server re-validates the allowlist on upload.
const ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,audio/mpeg,application/pdf,' +
  'application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
  'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,' +
  'application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,' +
  'text/plain,text/csv,application/zip'

/** Editor for the related-links list shown publicly under a reel/video. */
export function LinksEditor({ links, onChange }: { links: MediaLink[]; onChange: (next: MediaLink[]) => void }) {
  function update(i: number, patch: Partial<MediaLink>) {
    onChange(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }
  function remove(i: number) {
    onChange(links.filter((_, idx) => idx !== i))
  }
  function add() {
    onChange([...links, { label: '', url: '' }])
  }

  return (
    <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
      <div>
        <p className="text-sm font-medium text-[var(--foreground)]">Links</p>
        <p className="text-xs text-[var(--muted)] mt-0.5">Tappable buttons to related pages — articles, products, sign-ups.</p>
      </div>

      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((link, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-2 flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <input
                value={link.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Label — e.g. Read the article"
                className={`${inputCls} sm:w-48`}
              />
              <input
                value={link.url}
                onChange={(e) => update(i, { url: e.target.value })}
                placeholder="https://…"
                inputMode="url"
                className={`${inputCls} flex-1`}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove link"
                className="tap-scale self-end sm:self-auto shrink-0 h-9 w-9 inline-flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-red-500 hover:bg-[var(--surface)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={add}
        className="tap-scale inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-dashed border-[var(--border)] text-sm font-medium text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
      >
        <Plus size={15} /> Add link
      </button>
    </div>
  )
}

/** Editor for the downloadable/previewable file list, with inline upload. */
export function AttachmentsEditor({
  attachments,
  onChange,
}: {
  attachments: MediaAttachment[]
  onChange: (next: MediaAttachment[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFiles(fileList: FileList) {
    setUploading(true)
    setError('')
    const added: MediaAttachment[] = []
    for (const file of Array.from(fileList)) {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/media/attachment', { method: 'POST', body: fd })
      if (res.ok) {
        const data = (await res.json()) as MediaAttachment
        added.push({ name: data.name, url: data.url, size: data.size ?? null, type: data.type ?? null })
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? `Couldn’t upload ${file.name}`)
        break
      }
    }
    if (added.length) onChange([...attachments, ...added])
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function remove(i: number) {
    onChange(attachments.filter((_, idx) => idx !== i))
  }

  return (
    <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
      <div>
        <p className="text-sm font-medium text-[var(--foreground)]">Attachments</p>
        <p className="text-xs text-[var(--muted)] mt-0.5">Files visitors can preview or download.</p>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((att, i) => (
            <AttachmentRow key={i} att={att} onRemove={() => remove(i)} />
          ))}
        </div>
      )}

      <label
        className={[
          'tap-scale inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-dashed text-sm font-medium transition-colors',
          uploading
            ? 'border-[var(--border)] text-[var(--muted)] cursor-default'
            : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] cursor-pointer',
        ].join(' ')}
      >
        {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
        {uploading ? 'Uploading…' : 'Upload files'}
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const files = e.target.files
            if (files && files.length) handleFiles(files)
          }}
        />
      </label>

      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-[11px] text-[var(--muted)]">Images, video, audio, PDF, Office docs, text, CSV or ZIP · up to 25 MB each.</p>
    </div>
  )
}

function AttachmentRow({ att, onRemove }: { att: MediaAttachment; onRemove: () => void }) {
  const kind = attachmentKind(att)
  const size = formatBytes(att.size)
  const Icon = kind === 'video' ? Film : kind === 'audio' ? Music : kind === 'pdf' || kind === 'doc' ? FileText : FileIcon

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-2">
      <span className="shrink-0 h-11 w-11 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center text-[var(--muted)]">
        {kind === 'image' ? (
          <img src={att.url} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icon size={18} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--foreground)] truncate">{att.name}</p>
        {size && <p className="text-xs text-[var(--muted)] mt-0.5">{size}</p>}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove attachment"
        className="tap-scale shrink-0 h-9 w-9 inline-flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-red-500 hover:bg-[var(--surface)] transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}
