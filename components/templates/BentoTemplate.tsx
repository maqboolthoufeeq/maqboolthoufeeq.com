import Link from 'next/link'
import Image from 'next/image'
import { getSiteContent } from '@/lib/site-content'
import { prisma } from '@/lib/prisma'
import { readingTime } from '@/lib/utils'
import VisitorCount from '@/components/VisitorCount'
import SocialMedia from '@/components/sections/SocialMedia'

export default async function BentoTemplate() {
  const [hero, about, footer, sections] = await Promise.all([
    getSiteContent('hero'),
    getSiteContent('about'),
    getSiteContent('footer'),
    getSiteContent('sections'),
  ])

  const [projects, posts] = await Promise.all([
    prisma.project.findMany({
      where: { featured: true },
      orderBy: { order: 'asc' },
      take: 4,
      include: { tags: { select: { id: true, name: true } } },
    }),
    prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      take: 2,
      select: { id: true, title: true, slug: true, content: true, publishedAt: true },
    }),
  ])

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      {/* Navbar */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          borderColor: 'var(--border)',
          background: 'color-mix(in srgb, var(--background) 85%, transparent)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
            {footer.copyrightName}
          </Link>
          <div className="hidden sm:flex gap-6">
            {['About', 'Projects', 'Blog', 'Contact'].map((l) => (
              <Link key={l} href={`/#${l.toLowerCase()}`} className="text-sm" style={{ color: 'var(--muted)' }}>
                {l}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
          {/* Hero card — spans 2 cols */}
          <div
            className="sm:col-span-2 rounded-3xl p-8 flex flex-col justify-between"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', minHeight: '240px' }}
          >
            <div>
              <span
                className="inline-block px-3 py-1 text-xs font-semibold rounded-full mb-4"
                style={{
                  background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                  color: 'var(--accent)',
                }}
              >
                {hero.title}
              </span>
              <h1 className="text-4xl font-extrabold mb-3 leading-tight" style={{ color: 'var(--foreground)' }}>
                {hero.greeting}{' '}
                <span style={{ color: 'var(--accent)' }}>{hero.name}</span>
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                {hero.description}
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <Link
                href={hero.cta1Href}
                className="px-5 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--accent)' }}
              >
                {hero.cta1Label}
              </Link>
              <Link
                href={hero.cta2Href}
                className="px-5 py-2 rounded-xl text-sm font-medium border"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                {hero.cta2Label}
              </Link>
            </div>
          </div>

          {/* Profile card */}
          <div
            className="rounded-3xl flex flex-col items-center justify-center p-6 text-center"
            style={{
              background: 'color-mix(in srgb, var(--accent) 10%, var(--surface))',
              border: '1px solid var(--border)',
              minHeight: '240px',
            }}
          >
            {hero.imageVisible && hero.imageUrl ? (
              <div
                className="w-24 h-24 rounded-full overflow-hidden border-4 mb-4"
                style={{ borderColor: 'var(--accent)' }}
              >
                <Image
                  src={hero.imageUrl}
                  alt={hero.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div
                className="w-24 h-24 rounded-full mb-4 flex items-center justify-center text-4xl font-bold text-white"
                style={{ background: 'var(--accent)' }}
              >
                {hero.name[0]}
              </div>
            )}
            <p className="font-bold text-base" style={{ color: 'var(--foreground)' }}>
              {hero.name}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              {hero.title}
            </p>
          </div>

          {/* Skills card */}
          {sections.about && (
            <div
              className="rounded-3xl p-6"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--foreground)' }}>
                Tech Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {about.skills.slice(0, 9).map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 text-xs rounded-full font-medium"
                    style={{
                      background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                      color: 'var(--accent)',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Project cards */}
          {sections.projects &&
            projects.slice(0, 2).map((p) => (
              <div
                key={p.id}
                className="rounded-3xl overflow-hidden"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                {p.imageUrl ? (
                  <div className="relative h-32">
                    <Image src={p.imageUrl} alt={p.title} fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div
                    className="h-28"
                    style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}
                  />
                )}
                <div className="p-5">
                  <h3 className="font-semibold text-sm mb-1.5" style={{ color: 'var(--foreground)' }}>
                    {p.title}
                  </h3>
                  <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--muted)' }}>
                    {p.description}
                  </p>
                  <div className="flex gap-3">
                    {p.liveUrl && (
                      <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                        Live ↗
                      </a>
                    )}
                    {p.repoUrl && (
                      <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: 'var(--muted)' }}>
                        Code ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}

          {/* Blog card — spans 2 cols */}
          {sections.blogPreview && posts.length > 0 && (
            <div
              className="sm:col-span-2 rounded-3xl p-6"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                  Latest Writing
                </h3>
                <Link href="/blog" className="text-xs" style={{ color: 'var(--accent)' }}>
                  All posts →
                </Link>
              </div>
              <div className="space-y-3">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="flex items-start justify-between gap-4 p-3 rounded-xl"
                    style={{ background: 'color-mix(in srgb, var(--border) 40%, transparent)' }}
                  >
                    <div>
                      <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--foreground)' }}>
                        {post.title}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
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
                    <span className="shrink-0 text-sm" style={{ color: 'var(--accent)' }}>
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* All projects CTA */}
          {sections.projects && (
            <Link
              href="/projects"
              className="rounded-3xl p-6 flex flex-col items-center justify-center text-center"
              style={{
                background: 'color-mix(in srgb, var(--accent) 8%, var(--surface))',
                border: '1px solid var(--border)',
              }}
            >
              <span className="text-3xl mb-2" style={{ color: 'var(--accent)' }}>
                →
              </span>
              <p className="font-semibold text-sm" style={{ color: 'var(--accent)' }}>
                All Projects
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                See everything I&apos;ve built
              </p>
            </Link>
          )}
        </div>

        {sections.socialMedia && <SocialMedia />}
      </main>

      <footer
        className="text-center py-8 text-xs"
        style={{ color: 'var(--muted)', borderTop: '1px solid var(--border)', marginTop: '2rem' }}
      >
        © {new Date().getFullYear()} {footer.copyrightName}
        <VisitorCount />
      </footer>
    </div>
  )
}
