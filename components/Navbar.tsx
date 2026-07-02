import Link from 'next/link'
import ThemeToggle from './ThemeToggle'
import MobileMenu from './MobileMenu'
import SearchBar from './search/SearchBar'
import { getSiteContent } from '@/lib/site-content'
import { isExternal } from '@/lib/utils'
import { auth } from '@/lib/auth'

const linkCls = 'px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--surface)] active:bg-[var(--surface)] active:scale-95 transition-all'

export default async function Navbar() {
  const [navbar, hub, session] = await Promise.all([
    getSiteContent('navbar'),
    getSiteContent('hub'),
    auth(),
  ])

  // The Link Hub is a single admin toggle (Admin → Landing page → Link hub):
  // when on, its link is appended to both the desktop list and the mobile menu
  // without disturbing the admin's manually-ordered nav links.
  const links = hub.navEnabled
    ? [...navbar.links, { href: '/hub', label: hub.navLabel || 'Hub' }]
    : navbar.links

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex flex-col leading-tight hover:text-[var(--accent)] transition-colors group"
        >
          {navbar.brandTag && (
            <span className="text-[10px] font-medium tracking-widest uppercase text-[var(--accent)] group-hover:text-[var(--accent)]">
              {navbar.brandTag}
            </span>
          )}
          <span className="font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
            {navbar.brandName}
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <ul className="hidden sm:flex items-center gap-1">
            {links.map(({ href, label }) => (
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
          <SearchBar />
          <Link
            href={session ? '/admin' : '/admin/login'}
            title="Admin"
            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="sr-only">Admin</span>
          </Link>
          <ThemeToggle />
          <MobileMenu links={links} />
        </div>
      </nav>
    </header>
  )
}
