import Link from 'next/link'
import { getSeo, getSiteContent } from '@/lib/site-content'
import { isExternal } from '@/lib/utils'
import { SOCIAL_ICONS } from '@/components/SocialIcons'
import VisitorCount from '@/components/VisitorCount'

type FooterLink = { href: string; label: string }

function FooterAnchor({ href, label }: FooterLink) {
  const cls =
    'text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors'
  return isExternal(href) ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {label}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {label}
    </Link>
  )
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  if (links.length === 0) return null
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-3">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={`${l.href}-${l.label}`}>
            <FooterAnchor {...l} />
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Full-width site footer shared by every landing-page template and the public
 * content pages. Surfaces the brand, every user-visible section, and the legal
 * pages (privacy policy + terms). Reads visibility toggles so hidden sections
 * don't leak into the footer.
 */
export default async function SiteFooter() {
  const [footer, navbar, sections, hub, contact, hero, seo] = await Promise.all([
    getSiteContent('footer'),
    getSiteContent('navbar'),
    getSiteContent('sections'),
    getSiteContent('hub'),
    getSiteContent('contact'),
    getSiteContent('hero'),
    getSeo(),
  ])

  // "Explore" — the admin-curated navbar links, plus the hub when it's enabled.
  const exploreLinks: FooterLink[] = [
    ...navbar.links,
    ...(hub.navEnabled ? [{ href: '/hub', label: hub.navLabel || 'Hub' }] : []),
  ].filter((l) => l.href && l.label)

  // "Content" — every standalone public destination that currently has a home.
  const contentLinks: FooterLink[] = [
    { href: '/blog', label: 'Blog' },
    ...(sections.projects ? [{ href: '/projects', label: 'Projects' }] : []),
    ...(sections.socialMedia && sections.socialReels ? [{ href: '/reels', label: 'Reels' }] : []),
    ...(sections.socialMedia && sections.socialVideos ? [{ href: '/videos', label: 'Videos' }] : []),
    { href: '/announcements', label: 'Announcements' },
  ]

  // "Legal & info" — the legal pages plus a contact entry point.
  const legalLinks: FooterLink[] = [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms & Conditions' },
    ...(sections.contact ? [{ href: '/#contact', label: 'Contact' }] : []),
    ...(contact.email ? [{ href: `mailto:${contact.email}`, label: contact.email }] : []),
  ]

  const social = (hero.socialLinks ?? []).filter((s) => s.href)

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]/40">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:py-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-6">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link
              href="/"
              className="text-lg font-bold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
            >
              {seo.siteName}
            </Link>
            {footer.tagline && (
              <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed max-w-xs">
                {footer.tagline}
              </p>
            )}
            {social.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {social.map((link, i) => (
                  <a
                    key={i}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={link.platform}
                    aria-label={link.platform}
                    className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                  >
                    {SOCIAL_ICONS[link.platform] ?? SOCIAL_ICONS.website}
                  </a>
                ))}
              </div>
            )}
          </div>

          <FooterColumn title="Explore" links={exploreLinks} />
          <FooterColumn title="Content" links={contentLinks} />
          <FooterColumn title="Legal & info" links={legalLinks} />
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--muted)] text-center sm:text-left">
            © {new Date().getFullYear()} {footer.copyrightName}
            <VisitorCount />
          </p>
          <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
            <Link href="/privacy" className="hover:text-[var(--foreground)] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[var(--foreground)] transition-colors">
              Terms
            </Link>
            <Link href="/announcements" className="hover:text-[var(--foreground)] transition-colors">
              Latest
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
