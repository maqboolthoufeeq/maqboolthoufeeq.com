'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Plus, X, FileText, FolderPlus, Palette, LayoutDashboard, Link2, Megaphone } from 'lucide-react'

type Item = {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
}

const ITEMS: Item[] = [
  { href: '/admin', label: 'Admin Page', icon: LayoutDashboard },
  { href: '/admin/hub', label: 'Hub', icon: Link2 },
  { href: '/admin/banners', label: 'Announcements', icon: Megaphone },
  { href: '/admin/theme', label: 'Change Theme', icon: Palette },
  { href: '/admin/projects/new', label: 'Add Project', icon: FolderPlus },
  { href: '/admin/posts/new', label: 'Create Post', icon: FileText },
]

/**
 * Admin-only floating action button on the public landing page. The "+" expands
 * into a speed-dial of quick actions (create post, add project, change theme,
 * link hub, announcements, open admin). Only rendered when an admin session is
 * detected by the server.
 */
export default function AdminFab() {
  const [open, setOpen] = useState(false)

  // Close on Escape; lock nothing (the page stays interactive behind the dial).
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="fixed bottom-5 right-5 z-[70] flex flex-col items-end gap-3 print:hidden">
      {/* Dim backdrop — click anywhere to close */}
      {open && (
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 -z-10 cursor-default bg-black/20 backdrop-blur-[1px] animate-sheet-fade"
        />
      )}

      {/* Speed-dial items */}
      <ul className="flex flex-col items-end gap-3">
        {ITEMS.map((item, i) => {
          const Icon = item.icon
          return (
            <li
              key={item.href}
              className={[
                'flex items-center gap-3 transition-all duration-200 ease-out',
                open
                  ? 'translate-y-0 opacity-100'
                  : 'pointer-events-none translate-y-3 opacity-0',
              ].join(' ')}
              style={{ transitionDelay: open ? `${i * 40}ms` : '0ms' }}
            >
              <span className="rounded-lg bg-[var(--foreground)] px-2.5 py-1 text-xs font-semibold text-[var(--background)] shadow-md">
                {item.label}
              </span>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                aria-label={item.label}
                className="tap-scale flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] shadow-lg hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors"
              >
                <Icon size={18} />
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Main toggle */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={open ? 'Close admin menu' : 'Open admin menu'}
        className="tap-scale flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-xl shadow-black/25 transition-transform hover:opacity-95"
      >
        {open ? <X size={26} strokeWidth={2.4} /> : <Plus size={26} strokeWidth={2.4} />}
      </button>
    </div>
  )
}
