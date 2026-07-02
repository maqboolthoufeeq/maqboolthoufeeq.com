'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { isExternal } from '@/lib/utils'

type NavLink = { href: string; label: string }

const mobileLinkCls =
  'block px-4 py-3 text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] active:bg-[var(--surface)] active:scale-[0.98] rounded-lg transition-all'

export default function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="sm:hidden relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle menu"
        className="p-2 rounded-lg hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)] transition-all"
      >
        {open ? (
          <X size={18} className="text-[var(--muted)]" />
        ) : (
          <Menu size={18} className="text-[var(--muted)]" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-lg p-2 flex flex-col gap-0.5">
          {links.map(({ href, label }) =>
            isExternal(href) ? (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={mobileLinkCls}
                onClick={() => setOpen(false)}
              >
                {label}
              </a>
            ) : (
              <Link
                key={href}
                href={href}
                className={mobileLinkCls}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  )
}
