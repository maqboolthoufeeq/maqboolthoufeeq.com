import Link from 'next/link'
import Image from 'next/image'
import { getSiteContent } from '@/lib/site-content'
import { prisma } from '@/lib/prisma'
import VisitorCount from '@/components/VisitorCount'
import SocialMedia from '@/components/sections/SocialMedia'

export default async function SidebarTemplate() {
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
          take: 6,
          include: { tags: { select: { id: true, name: true } } },
        })
      : Promise.resolve([]),
    sections.blogPreview
      ? prisma.post.findMany({
          where: { published: true },
          orderBy: { publishedAt: 'desc' },
          take: 4,
          select: { id: true, title: true, slug: true, content: true, publishedAt: true },
        })
      : Promise.resolve([]),
  ])

  const navLinks = [
    { href: '#about', label: 'About' },
    { href: '#projects', label: 'Projects' },
    { href: '#blog', label: 'Blog' },
    { href: '#contact', label: 'Contact' },
  ]

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      {/* Sidebar */}
      <aside
        className="w-64 shrink-0 hidden lg:flex flex-col sticky top-0 h-screen overflow-y-auto border-r py-8 px-6"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        {/* Avatar */}
        {hero.imageVisible && hero.imageUrl ? (
          <div
            className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2"
            style={{ borderColor: 'var(--accent)' }}
          >
            <Image
              src={hero.imageUrl}
              alt={hero.name}
              width={80}
              height={80}
              className="object-cover w-full h-full"
              priority
              unoptimized
            />
          </div>
        ) : (
          <div
            className="w-20 h-20 rounded-full mb-4 flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: 'var(--accent)' }}
          >
            {hero.name[0]}
          </div>
        )}

        <h2 className="font-bold text-base mb-0.5" style={{ color: 'var(--foreground)' }}>
          {hero.name}
        </h2>
        <p className="text-xs mb-6" style={{ color: 'var(--accent)' }}>
          {hero.title}
        </p>

        <nav className="flex flex-col gap-1 mb-8">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--muted)' }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Skills */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>
            Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {about.skills.slice(0, 8).map((s) => (
              <span
                key={s}
                className="px-2 py-0.5 text-xs rounded"
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

        <div className="mt-auto text-xs" style={{ color: 'var(--muted)' }}>
          © {new Date().getFullYear()} {footer.copyrightName}
          <VisitorCount />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 px-6 lg:px-12 py-12">
        <div className="max-w-3xl">
          {/* Hero text */}
          {sections.hero && (
            <section id="about" className="mb-16">
              <p
                className="text-xs font-semibold tracking-widest uppercase mb-3"
                style={{ color: 'var(--accent)' }}
              >
                {hero.greeting}
              </p>
              <h1 className="text-4xl font-bold mb-4 leading-tight" style={{ color: 'var(--foreground)' }}>
                {hero.name}
              </h1>
              <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--muted)' }}>
                {hero.description}
              </p>
              <div className="flex gap-3">
                <Link
                  href={hero.cta1Href}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  {hero.cta1Label}
                </Link>
                <Link
                  href={hero.cta2Href}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium border"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                >
                  {hero.cta2Label}
                </Link>
              </div>
            </section>
          )}

          {/* About */}
          {sections.about && (
            <section className="mb-16">
              <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
                About me
              </h2>
              <div className="space-y-4" style={{ color: 'var(--muted)' }}>
                {about.paragraphs.map((p, i) => (
                  <p key={i} className="leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {sections.projects && projects.length > 0 && (
            <section id="projects" className="mb-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                  Projects
                </h2>
                <Link href="/projects" className="text-sm" style={{ color: 'var(--accent)' }}>
                  All →
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {projects.map((p) => (
                  <article
                    key={p.id}
                    className="p-5 rounded-xl border flex flex-col gap-3"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                  >
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                      {p.title}
                    </h3>
                    <p className="text-xs leading-relaxed flex-1 line-clamp-2" style={{ color: 'var(--muted)' }}>
                      {p.description}
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      {p.tech.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 text-xs rounded-full border"
                          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {p.liveUrl && (
                        <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: 'var(--accent)' }}>
                          Live ↗
                        </a>
                      )}
                      {p.repoUrl && (
                        <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: 'var(--muted)' }}>
                          Code ↗
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Social media */}
          {sections.socialMedia && <SocialMedia />}

          {/* Blog */}
          {sections.blogPreview && posts.length > 0 && (
            <section id="blog" className="mb-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                  Writing
                </h2>
                <Link href="/blog" className="text-sm" style={{ color: 'var(--accent)' }}>
                  All →
                </Link>
              </div>
              <ul className="space-y-3">
                {posts.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="flex justify-between items-center p-4 rounded-lg border transition-colors"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                    >
                      <div>
                        <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                          {post.title}
                        </h3>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric',
                              })
                            : ''}
                        </p>
                      </div>
                      <span className="text-sm ml-4 shrink-0" style={{ color: 'var(--accent)' }}>
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
