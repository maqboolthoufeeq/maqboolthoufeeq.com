import Link from 'next/link'
import ThemeToggle from './ThemeToggle'
import { getSiteContent } from '@/lib/site-content'
import { isExternal } from '@/lib/utils'

const linkCls = 'px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--surface)] transition-all'

export default async function Navbar() {
  const navbar = await getSiteContent('navbar')

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
        >
          {navbar.brandName}
        </Link>

        <div className="flex items-center gap-1">
          <ul className="hidden sm:flex items-center gap-1">
            {navbar.links.map(({ href, label }) => (
              <li key={href}>
                {isExternal(href) ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className={linkCls}>
                    {label}
                  </a>
                ) : (
                  <Link href={href} className={linkCls}>
                    {label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
