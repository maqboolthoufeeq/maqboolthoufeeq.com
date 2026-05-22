import Link from 'next/link'
import Image from 'next/image'
import { getSiteContent } from '@/lib/site-content'
import { prisma } from '@/lib/prisma'
import { readingTime } from '@/lib/utils'

const INK = '#1a1814'
const FADED = '#6b6560'
const RULE = '#d4d0ca'
const BG = '#faf8f4'
const SURFACE = '#f2efe9'
const SERIF = 'Georgia, "Times New Roman", serif'
const SANS = 'system-ui, -apple-system, sans-serif'

export default async function MagazineTemplate() {
  const [hero, about, footer, sections] = await Promise.all([
    getSiteContent('hero'),
    getSiteContent('about'),
    getSiteContent('footer'),
    getSiteContent('sections'),
  ])

  const [projects, posts] = await Promise.all([
    sections.projects
      ? prisma.project.findMany({
          where: { featured: true },
          orderBy: { order: 'asc' },
          take: 4,
          include: { tags: { select: { id: true, name: true } } },
        })
      : Promise.resolve([]),
    sections.blogPreview
      ? prisma.post.findMany({
          where: { published: true },
          orderBy: { publishedAt: 'desc' },
          take: 3,
          select: { id: true, title: true, slug: true, excerpt: true, content: true, publishedAt: true },
        })
      : Promise.resolve([]),
  ])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: SERIF, color: INK }}>
      {/* Masthead */}
      <header style={{ borderBottom: `3px double ${RULE}`, padding: '24px 0 16px' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center justify-between mb-3" style={{ fontFamily: SANS }}>
            <span className="text-xs tracking-widest uppercase" style={{ color: FADED }}>
              Portfolio
            </span>
            <span className="text-xs" style={{ color: FADED }}>
              {today}
            </span>
            <nav className="hidden sm:flex gap-5">
              {['About', 'Projects', 'Blog'].map((l) => (
                <Link key={l} href={`/#${l.toLowerCase()}`} className="text-xs tracking-wider uppercase" style={{ color: FADED }}>
                  {l}
                </Link>
              ))}
            </nav>
          </div>

          <div style={{ borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}`, padding: '12px 0', textAlign: 'center' }}>
            <h1 className="text-5xl font-black tracking-tight leading-none" style={{ fontFamily: SERIF, color: INK }}>
              {footer.copyrightName}
            </h1>
            <p className="text-sm mt-1 italic" style={{ color: FADED, fontFamily: SERIF }}>
              {hero.title}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        {/* Hero — 2-col editorial layout */}
        {sections.hero && (
          <section
            className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10"
            style={{ borderBottom: `1px solid ${RULE}` }}
          >
            {/* Pull-quote side */}
            <div className="flex flex-col justify-center">
              <p
                className="text-xs font-bold tracking-widest uppercase mb-6"
                style={{ color: FADED, fontFamily: SANS }}
              >
                {hero.greeting} &mdash; {hero.title}
              </p>
              <blockquote
                className="text-3xl font-bold leading-snug mb-6"
                style={{ fontFamily: SERIF, color: INK, borderLeft: `4px solid ${INK}`, paddingLeft: '1.25rem' }}
              >
                &ldquo;{hero.description}&rdquo;
              </blockquote>
              <div className="flex gap-3" style={{ fontFamily: SANS }}>
                <Link
                  href={hero.cta1Href}
                  className="px-5 py-2 text-sm font-semibold text-white"
                  style={{ background: INK }}
                >
                  {hero.cta1Label}
                </Link>
                <Link
                  href={hero.cta2Href}
                  className="px-5 py-2 text-sm font-semibold border"
                  style={{ borderColor: INK, color: INK }}
                >
                  {hero.cta2Label}
                </Link>
              </div>
            </div>

            {/* Image / about side */}
            <div className="flex flex-col">
              {hero.imageVisible && hero.imageUrl ? (
                <div className="relative w-full mb-4" style={{ height: '280px' }}>
                  <Image
                    src={hero.imageUrl}
                    alt={hero.name}
                    fill
                    className="object-cover"
                    style={{ filter: 'grayscale(20%)' }}
                    unoptimized
                  />
                </div>
              ) : (
                <div
                  className="w-full mb-4 flex items-center justify-center text-6xl font-black"
                  style={{ height: '280px', background: SURFACE, color: RULE }}
                >
                  {hero.name[0]}
                </div>
              )}
              {sections.about && about.paragraphs[0] && (
                <p className="text-sm leading-relaxed italic" style={{ color: FADED }}>
                  {about.paragraphs[0]}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Projects — 2-col grid */}
        {sections.projects && projects.length > 0 && (
          <section className="py-10" style={{ borderBottom: `1px solid ${RULE}` }}>
            <div className="flex items-baseline justify-between mb-6">
              <h2
                className="text-2xl font-black tracking-tight"
                style={{ fontFamily: SERIF, borderBottom: `3px solid ${INK}`, paddingBottom: '4px' }}
              >
                Selected Work
              </h2>
              <Link href="/projects" className="text-xs tracking-widest uppercase" style={{ color: FADED, fontFamily: SANS }}>
                See All →
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {projects.map((p, idx) => (
                <article key={p.id} className="flex flex-col gap-3">
                  {p.imageUrl ? (
                    <div className="relative w-full" style={{ height: '180px' }}>
                      <Image
                        src={p.imageUrl}
                        alt={p.title}
                        fill
                        className="object-cover"
                        style={{ filter: 'grayscale(100%)' }}
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div
                      className="w-full flex items-center justify-center"
                      style={{ height: '120px', background: SURFACE }}
                    >
                      <span className="text-4xl font-black" style={{ color: RULE }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                  <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: '12px' }}>
                    <h3 className="text-lg font-bold mb-1" style={{ fontFamily: SERIF }}>
                      {p.title}
                    </h3>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: FADED }}>
                      {p.description}
                    </p>
                    <div className="flex items-center justify-between" style={{ fontFamily: SANS }}>
                      <p className="text-xs italic" style={{ color: RULE }}>
                        {p.tech.slice(0, 3).join(' · ')}
                      </p>
                      <div className="flex gap-3">
                        {p.liveUrl && (
                          <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: INK }}>
                            Live ↗
                          </a>
                        )}
                        {p.repoUrl && (
                          <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: FADED }}>
                            Code ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Blog — 3-col */}
        {sections.blogPreview && posts.length > 0 && (
          <section className="py-10" style={{ borderBottom: `1px solid ${RULE}` }}>
            <div className="flex items-baseline justify-between mb-6">
              <h2
                className="text-2xl font-black tracking-tight"
                style={{ fontFamily: SERIF, borderBottom: `3px solid ${INK}`, paddingBottom: '4px' }}
              >
                Latest Writing
              </h2>
              <Link href="/blog" className="text-xs tracking-widest uppercase" style={{ color: FADED, fontFamily: SANS }}>
                All Posts →
              </Link>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {posts.map((post, idx) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="flex flex-col gap-2 group">
                  {idx === 0 && (
                    <span
                      className="text-xs font-bold tracking-widest uppercase px-2 py-0.5 self-start"
                      style={{ background: INK, color: BG, fontFamily: SANS }}
                    >
                      Editor&apos;s Pick
                    </span>
                  )}
                  <h3 className="text-base font-bold leading-snug" style={{ fontFamily: SERIF }}>
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: FADED }}>
                      {post.excerpt}
                    </p>
                  )}
                  <p className="text-xs mt-auto italic" style={{ color: RULE, fontFamily: SANS }}>
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      : ''}
                    {' · '}
                    {readingTime(post.content)} min read
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer
        className="text-center py-8 text-xs"
        style={{ color: FADED, fontFamily: SANS, borderTop: `1px solid ${RULE}`, marginTop: '2rem' }}
      >
        © {new Date().getFullYear()} {footer.copyrightName}
      </footer>
    </div>
  )
}
