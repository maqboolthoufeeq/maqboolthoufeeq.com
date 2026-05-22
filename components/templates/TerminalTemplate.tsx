import Link from 'next/link'
import { getSiteContent } from '@/lib/site-content'
import { prisma } from '@/lib/prisma'
import { readingTime } from '@/lib/utils'

const GREEN = '#00ff41'
const DIM = '#4ade80'
const DIMMER = '#166534'
const BG = '#0a0a0a'
const SURFACE = '#111111'

export default async function TerminalTemplate() {
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

  return (
    <div
      style={{
        background: BG,
        minHeight: '100vh',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        color: GREEN,
      }}
    >
      {/* Terminal title bar */}
      <div
        className="sticky top-0 z-50 px-6 h-10 flex items-center gap-2"
        style={{ background: SURFACE, borderBottom: `1px solid ${DIMMER}` }}
      >
        <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
        <span className="mx-auto text-xs" style={{ color: DIMMER }}>
          ~/portfolio — bash
        </span>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* whoami */}
        {sections.hero && (
          <section className="mb-12">
            <p className="text-xs mb-2" style={{ color: DIMMER }}>
              $ whoami
            </p>
            <p className="text-3xl font-bold mb-1" style={{ color: GREEN }}>
              {hero.name}
            </p>
            <p className="mb-1" style={{ color: DIM }}>
              {'// '}{hero.title}
            </p>
            <p className="mb-6 max-w-2xl leading-relaxed" style={{ color: '#86efac' }}>
              {hero.description}
            </p>
            <p className="text-xs mb-2" style={{ color: DIMMER }}>
              $ cat links.txt
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href={hero.cta1Href} className="text-sm underline underline-offset-2" style={{ color: GREEN }}>
                {hero.cta1Label}
              </Link>
              <Link href={hero.cta2Href} className="text-sm underline underline-offset-2" style={{ color: DIM }}>
                {hero.cta2Label}
              </Link>
            </div>
          </section>
        )}

        {/* skills */}
        {sections.about && (
          <section className="mb-12">
            <p className="text-xs mb-2" style={{ color: DIMMER }}>
              $ cat skills.json
            </p>
            <div className="p-4 rounded" style={{ background: SURFACE, border: `1px solid ${DIMMER}` }}>
              <p className="text-xs mb-2" style={{ color: '#374151' }}>
                {'{'}
              </p>
              <p className="text-xs px-4 mb-2 leading-relaxed" style={{ color: '#86efac' }}>
                <span style={{ color: DIM }}>&quot;stack&quot;</span>
                {': ['}
                {about.skills.map((s, i) => (
                  <span key={s}>
                    <span style={{ color: GREEN }}>&quot;{s}&quot;</span>
                    {i < about.skills.length - 1 ? ', ' : ''}
                  </span>
                ))}
                {']'}
              </p>
              {about.paragraphs.slice(0, 1).map((p, i) => (
                <p key={i} className="text-xs px-4" style={{ color: '#86efac' }}>
                  <span style={{ color: DIM }}>&quot;about&quot;</span>
                  {': '}
                  <span style={{ color: GREEN }}>&quot;{p}&quot;</span>
                </p>
              ))}
              <p className="text-xs mt-2" style={{ color: '#374151' }}>
                {'}'}
              </p>
            </div>
          </section>
        )}

        {/* projects */}
        {sections.projects && projects.length > 0 && (
          <section className="mb-12">
            <p className="text-xs mb-2" style={{ color: DIMMER }}>
              $ ls -la projects/
            </p>
            <div className="space-y-3">
              {projects.map((p) => (
                <div key={p.id} className="p-4 rounded" style={{ background: SURFACE, border: `1px solid ${DIMMER}` }}>
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <p className="text-sm font-bold" style={{ color: GREEN }}>
                      {p.title}
                    </p>
                    <div className="flex gap-3 shrink-0">
                      {p.liveUrl && (
                        <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: DIM }}>
                          live
                        </a>
                      )}
                      {p.repoUrl && (
                        <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: DIM }}>
                          repo
                        </a>
                      )}
                    </div>
                  </div>
                  <p className="text-xs mb-2" style={{ color: '#86efac' }}>
                    {p.description}
                  </p>
                  <p className="text-xs" style={{ color: DIMMER }}>
                    [{p.tech.join(' | ')}]
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* blog */}
        {sections.blogPreview && posts.length > 0 && (
          <section className="mb-12">
            <p className="text-xs mb-2" style={{ color: DIMMER }}>
              $ git log --oneline posts/
            </p>
            <div className="space-y-2">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="flex gap-4 p-3 rounded"
                  style={{ background: SURFACE, border: `1px solid ${DIMMER}` }}
                >
                  <span className="text-xs shrink-0" style={{ color: DIMMER }}>
                    {post.publishedAt ? new Date(post.publishedAt).toISOString().slice(2, 10) : 'unknown'}
                  </span>
                  <span className="text-xs" style={{ color: GREEN }}>
                    {post.title}
                  </span>
                  <span className="text-xs ml-auto shrink-0" style={{ color: DIMMER }}>
                    {readingTime(post.content)}m
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Blinking cursor */}
        <div className="flex items-center gap-2 mt-8">
          <span className="text-sm" style={{ color: DIM }}>
            $
          </span>
          <span className="w-2 h-5 animate-pulse" style={{ background: GREEN }} />
        </div>
      </main>

      <footer
        className="text-center py-6 text-xs"
        style={{ color: DIMMER, borderTop: `1px solid ${DIMMER}` }}
      >
        {footer.copyrightName}
      </footer>
    </div>
  )
}
