'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { buildShareLinks } from '@/lib/share'

type Props = {
  /** Canonical, absolute URL of the post. */
  url: string
  title: string
  /** Short description used by email / native share. */
  text?: string
}

type IconProps = { className?: string }

function LinkedInIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  )
}

function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  )
}

function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.8h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.72.98.99-3.63-.23-.37a9.8 9.8 0 0 1-1.5-5.23c0-5.42 4.41-9.83 9.84-9.83 2.63 0 5.1 1.03 6.96 2.89a9.78 9.78 0 0 1 2.88 6.95c0 5.42-4.41 9.83-9.85 9.83zM20.52 3.45A11.78 11.78 0 0 0 12.05 0C5.5 0 .16 5.33.16 11.88c0 2.1.55 4.14 1.6 5.95L.05 24l6.3-1.65a11.85 11.85 0 0 0 5.7 1.45h.01c6.54 0 11.88-5.33 11.88-11.88 0-3.17-1.24-6.16-3.48-8.41z" />
    </svg>
  )
}

function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.48l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41z" />
    </svg>
  )
}

function TelegramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.95 2.18a.86.86 0 0 0-.9-.13L1.13 10.62c-.55.21-.9.72-.87 1.28.03.56.42 1.03.99 1.18l5.3 1.43 2.05 6.55c.06.2.18.37.34.5l.03.03.05.03.04.03a.97.97 0 0 0 .57.13.97.97 0 0 0 .5-.2l3.02-2.53 4.92 3.64c.18.13.39.2.6.2.1 0 .2-.01.3-.04.32-.1.56-.36.64-.69L24 3.06a.86.86 0 0 0-.05-.88zM9.74 15.3l-.5 4.02-1.36-4.46 9.3-5.96-7.44 6.4z" />
    </svg>
  )
}

function MailIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function LinkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8" />
    </svg>
  )
}

function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function ShareIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  )
}

function DeviceShareIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v13" />
    </svg>
  )
}

const ICON = 'h-4 w-4 shrink-0'

export default function ShareButtons({ url, title, text }: Props) {
  const links = buildShareLinks({ url, title, text })
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    function onPointer(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const openPopup = useCallback((href: string) => {
    window.open(href, '_blank', 'noopener,noreferrer,width=600,height=640')
    setOpen(false)
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const el = document.createElement('textarea')
        el.value = url
        el.style.position = 'fixed'
        el.style.opacity = '0'
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard may be blocked */
    }
  }, [url])

  const handleNativeShare = useCallback(async () => {
    setOpen(false)
    try {
      await navigator.share({ title, text: text ?? title, url })
    } catch {
      /* user cancelled or unsupported */
    }
  }, [title, text, url])

  const itemClass =
    'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--background)] focus:bg-[var(--background)] focus:outline-none'

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--foreground)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)]/40"
      >
        <ShareIcon className={ICON} />
        Share
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Share this post"
          className="absolute left-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-xl shadow-black/20"
        >
          {canNativeShare && (
            <button type="button" role="menuitem" onClick={handleNativeShare} className={itemClass}>
              <DeviceShareIcon className={ICON} />
              Share via…
            </button>
          )}
          <button type="button" role="menuitem" onClick={() => openPopup(links.linkedin)} className={itemClass}>
            <LinkedInIcon className={ICON} />
            LinkedIn
          </button>
          <button type="button" role="menuitem" onClick={() => openPopup(links.facebook)} className={itemClass}>
            <FacebookIcon className={ICON} />
            Facebook
          </button>
          <button type="button" role="menuitem" onClick={() => openPopup(links.whatsapp)} className={itemClass}>
            <WhatsAppIcon className={ICON} />
            WhatsApp
          </button>
          <button type="button" role="menuitem" onClick={() => openPopup(links.twitter)} className={itemClass}>
            <XIcon className={ICON} />
            X (Twitter)
          </button>
          <button type="button" role="menuitem" onClick={() => openPopup(links.telegram)} className={itemClass}>
            <TelegramIcon className={ICON} />
            Telegram
          </button>
          <a role="menuitem" href={links.email} onClick={() => setOpen(false)} className={itemClass}>
            <MailIcon className={ICON} />
            Email
          </a>
          <div className="my-1 border-t border-[var(--border)]" />
          <button type="button" role="menuitem" onClick={handleCopy} className={itemClass}>
            {copied ? <CheckIcon className={ICON} /> : <LinkIcon className={ICON} />}
            {copied ? 'Link copied!' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  )
}
