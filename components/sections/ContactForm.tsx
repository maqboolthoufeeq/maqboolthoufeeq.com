'use client'

import { useRef, useState } from 'react'
import { CheckCircle, Paperclip, X, ArrowRight, Upload } from 'lucide-react'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED = '.jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.txt'

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] ' +
  'placeholder:text-[var(--muted)]/60 focus:outline-none focus:border-[var(--accent)] focus:ring-2 ' +
  'focus:ring-[var(--accent)]/10 transition-all text-sm'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFile(picked: File | null) {
    setFileError('')
    if (!picked) { setFile(null); return }
    if (picked.size > MAX_BYTES) {
      setFileError('File exceeds the 5 MB limit.')
      return
    }
    setFile(picked)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0] ?? null
    handleFile(dropped)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (fileError) return
    setStatus('loading')
    setErrorMsg('')

    const fd = new FormData()
    fd.append('name', name)
    fd.append('email', email)
    fd.append('message', message)
    if (file) fd.append('attachment', file)

    try {
      const res = await fetch('/api/contact', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.')
        return
      }
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 flex flex-col items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
          <CheckCircle className="text-[var(--accent)]" size={20} />
        </div>
        <div>
          <p className="font-semibold text-[var(--foreground)] mb-1">Message sent!</p>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Thanks for reaching out — I&apos;ll get back to you as soon as possible.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 space-y-5">

      {/* Name + Email row */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="contact-name" className="block text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            placeholder="Your name"
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="contact-email" className="block text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={254}
            placeholder="you@example.com"
            className={inputCls}
          />
        </div>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <label htmlFor="contact-message" className="block text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          placeholder="What's on your mind?"
          className={`${inputCls} resize-none`}
        />
        <p className="text-right text-[10px] text-[var(--muted)]/60">{message.length}/2000</p>
      </div>

      {/* File drop zone */}
      <div className="space-y-1.5">
        <p className="block text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
          Attachment <span className="normal-case font-normal">(optional, max 5 MB)</span>
        </p>

        {file ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/5">
            <Paperclip size={15} className="text-[var(--accent)] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--foreground)] truncate">{file.name}</p>
              <p className="text-[11px] text-[var(--muted)]">{formatBytes(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => { setFile(null); setFileError('') }}
              className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
              aria-label="Remove attachment"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`w-full flex flex-col items-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
              isDragging
                ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                : 'border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5'
            }`}
          >
            <Upload size={18} className={isDragging ? 'text-[var(--accent)]' : 'text-[var(--muted)]'} />
            <span className="text-sm text-[var(--muted)]">
              <span className="text-[var(--accent)] font-medium">Click to upload</span> or drag and drop
            </span>
            <span className="text-[11px] text-[var(--muted)]/70">
              Images, PDF, Word, TXT — up to 5 MB
            </span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />

        {fileError && <p className="text-red-400 text-xs">{fileError}</p>}
      </div>

      {status === 'error' && (
        <p className="text-red-400 text-sm bg-red-400/10 px-4 py-3 rounded-xl">{errorMsg}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === 'loading' || !!fileError}
        className="group flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
      >
        {status === 'loading' ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Sending…
          </>
        ) : (
          <>
            Send message
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </form>
  )
}
