import Link from 'next/link'
import Image from 'next/image'
import { getSiteContent } from '@/lib/site-content'
import { prisma } from '@/lib/prisma'
import { readingTime } from '@/lib/utils'
import VisitorCount from '@/components/VisitorCount'

const SOCIAL_SVG: Record<string, string> = {
  github:
    'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z',
  linkedin:
    'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.75l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  twitter:
    'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.75l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
}

export default async function CenteredTemplate() {
  const [hero, footer, sections] = await Promise.all([
    getSiteContent('hero'),
    getSiteContent('footer'),
    getSiteContent('sections'),
  ])

  const [projects, posts] = await Promise.all([
    sections.projects
      ? prisma.project.findMany({
          where: { featured: true },
          orderBy: { order: 'asc' },
          take: 6,
          include: { tags: { select: { id: true, name: true } } },
        })
      : Promise.resolve([]),
    sections.blogPreview
      ? prisma.post.findMany({
          where: { published: true },
          orderBy: { publishedAt: 'desc' },
          take: 4,
          select: { id: true, title: true, slug: true, excerpt: true, content: true, publishedAt: true },
        })
      : Promise.resolve([]),
  ])

  return (
    <div style={{ background: '#0b1220', minHeight: '100vh', color: '#e2e8f0' }}>
      {/* Navbar */}
      <header
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(11,18,32,0.85)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <nav className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-white text-sm tracking-wide">
            {footer.copyrightName}
          </Link>
          <div className="hidden sm:flex items-center gap-6">
            {['About', 'Projects', 'Blog', 'Contact'].map((l) => (
              <Link key={l} href={`/#${l.toLowerCase()}`} className="text-sm" style={{ color: '#94a3b8' }}>
                {l}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <p className="text-xs font-bold tracking-widest uppercase mb-6" style={{ color: 'var(--accent)' }}>
          {hero.title}
        </p>
        <h1 className="text-5xl sm:text-7xl font-extrabold mb-6 leading-tight" style={{ color: '#f1f5f9' }}>
          Hi, I&apos;m{' '}
          <span style={{ color: 'var(--accent)' }}>{hero.name.split(' ')[0]}</span>
          <br />
          {hero.name.split(' ').slice(1).join(' ')}
        </h1>
        <p className="text-lg mb-10 max-w-2xl mx-auto" style={{ color: '#94a3b8' }}>
          {hero.description}
        </p>
        <div className="flex items-center justify-center gap-4 mb-10">
          <Link
            href={hero.cta1Href}
            className="px-7 py-3 rounded-lg font-semibold text-sm text-white"
            style={{ background: 'var(--accent)' }}
          >
            {hero.cta1Label}
          </Link>
          <Link
            href={hero.cta2Href}
            className="px-7 py-3 rounded-lg font-semibold text-sm"
            style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0' }}
          >
            {hero.cta2Label}
          </Link>
        </div>

        {/* Social icons */}
        {hero.socialLinks.length > 0 && (
          <div className="flex items-center justify-center gap-4">
            {hero.socialLinks.slice(0, 5).map(({ platform, href }) => {
              const path = SOCIAL_SVG[platform.toLowerCase()]
              if (!path) return null
              return (
                <a
                  key={platform}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d={path} />
                  </svg>
                </a>
              )
            })}
          </div>
        )}
      </section>

      {/* Projects */}
      {sections.projects && projects.length > 0 && (
        <section id="projects" className="max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>
              Featured Projects
            </h2>
            <Link href="/projects" className="text-sm" style={{ color: 'var(--accent)' }}>
              All projects →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <article
                key={p.id}
                className="rounded-2xl overflow-hidden flex flex-col"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {p.imageUrl ? (
                  <div className="relative h-40">
                    <Image src={p.imageUrl} alt={p.title} fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div
                    className="h-28"
                    style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}
                  />
                )}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-semibold mb-2" style={{ color: '#f1f5f9' }}>
                    {p.title}
                  </h3>
                  <p className="text-sm mb-4 flex-1 line-clamp-2" style={{ color: '#94a3b8' }}>
                    {p.description}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {p.tech.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 text-xs rounded-full"
                        style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Blog */}
      {sections.blogPreview && posts.length > 0 && (
        <section id="blog" className="max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>
              Latest Articles
            </h2>
            <Link href="/blog" className="text-sm" style={{ color: 'var(--accent)' }}>
              All posts →
            </Link>
          </div>
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="flex items-center justify-between p-5 rounded-xl transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div>
                    <h3 className="font-medium mb-1" style={{ color: '#f1f5f9' }}>
                      {post.title}
                    </h3>
                    <p className="text-xs" style={{ color: '#64748b' }}>
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : ''}
                      {' · '}
                      {readingTime(post.content)} min read
                    </p>
                  </div>
                  <span style={{ color: 'var(--accent)' }} className="text-sm ml-4 shrink-0">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer
        className="text-center py-10 text-xs"
        style={{ color: '#475569', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        © {new Date().getFullYear()} {footer.copyrightName}
        <VisitorCount />
      </footer>
    </div>
  )
}
