import Link from 'next/link'
import { Search } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { search, type SearchResult } from '@/lib/search'
import { getSeo } from '@/lib/site-content'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q = '' } = await searchParams
  const seo = await getSeo()
  const title = q.trim()
    ? `"${q.trim()}" — Search — ${seo.siteName}`
    : `Search — ${seo.siteName}`
  return {
    title,
    description: q.trim() ? `Search results for "${q.trim()}"` : 'Search across all site content.',
    robots: 'noindex, nofollow',
  }
}

const BADGE_COLORS: Record<string, string> = {
  Blog: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
  Project: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800',
  Hub: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950 border-violet-200 dark:border-violet-800',
  Reel: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800',
  Video: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
}

const BADGE_ICONS: Record<string, string> = {
  Blog: '📝', Project: '🚀', Hub: '🔗', Reel: '🎬', Video: '▶️',
}

function ResultCard({ result }: { result: SearchResult }) {
  return (
    <Link
      href={result.href}
      className="group flex items-start gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--surface)] hover:border-[var(--accent)]/30 transition-all"
    >
      {/* Thumbnail / icon box */}
      <span className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-[var(--surface)] flex items-center justify-center">
        {result.imageUrl ? (
          <img
            src={result.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <span className="text-2xl leading-none select-none">
            {result.icon ?? BADGE_ICONS[result.badge] ?? '📄'}
          </span>
        )}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span
          className={`inline-flex items-center mb-1 text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-md border ${BADGE_COLORS[result.badge] ?? 'text-[var(--muted)] bg-[var(--surface)] border-[var(--border)]'}`}
        >
          {result.badge}
        </span>
        <p className="font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors truncate">
          {result.title}
        </p>
        {result.excerpt && (
          <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">
            {result.excerpt}
          </p>
        )}
        <p className="mt-1.5 text-xs text-[var(--muted)]/60 truncate">{result.href}</p>
      </div>
    </Link>
  )
}

function ResultGroup({ title, results }: { title: string; results: SearchResult[] }) {
  if (!results.length) return null
  return (
    <section>
      <h2 className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)] mb-3">
        {title} <span className="ml-1 opacity-60">({results.length})</span>
      </h2>
      <div className="flex flex-col gap-2">
        {results.map(r => (
          <ResultCard key={r.id} result={r} />
        ))}
      </div>
    </section>
  )
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = '' } = await searchParams
  const query = q.trim()

  const { results, total } = query.length >= 2
    ? await search(query, 50)
    : { results: [], total: 0 }

  const posts     = results.filter(r => r.type === 'post')
  const projects  = results.filter(r => r.type === 'project')
  const hubTopics = results.filter(r => r.type === 'hub_topic')
  const hubItems  = results.filter(r => r.type === 'hub_item')
  const reels     = results.filter(r => r.type === 'reel')
  const videos    = results.filter(r => r.type === 'video')

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">
            {query ? `Results for "${query}"` : 'Search'}
          </h1>
          {query && (
            <p className="text-sm text-[var(--muted)]">
              {total === 0
                ? 'No results found'
                : `${total} result${total !== 1 ? 's' : ''} across all content`}
            </p>
          )}
        </div>

        {/* Search form */}
        <form action="/search" method="get" className="mb-8">
          <div className="flex items-center gap-2 px-4 h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] focus-within:border-[var(--accent)]/50 focus-within:ring-2 focus-within:ring-[var(--accent)]/10 transition-all">
            <Search size={16} className="shrink-0 text-[var(--muted)]" aria-hidden />
            <input
              name="q"
              type="text"
              defaultValue={query}
              autoFocus={!query}
              placeholder="Search posts, projects, reels, videos, hub…"
              autoComplete="off"
              className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none"
            />
            {query && (
              <Link
                href="/search"
                className="shrink-0 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                aria-label="Clear search"
              >
                Clear
              </Link>
            )}
          </div>
        </form>

        {/* States */}
        {!query ? (
          <div className="flex flex-col items-center gap-3 py-16 text-[var(--muted)]">
            <Search size={36} className="opacity-30" aria-hidden />
            <p className="text-sm">Search posts, projects, reels, videos, and hub content</p>
          </div>
        ) : total === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-[var(--muted)]">
            <Search size={36} className="opacity-30" aria-hidden />
            <p className="text-sm font-medium">No results for &ldquo;{query}&rdquo;</p>
            <p className="text-xs opacity-70">Try different keywords or check the spelling</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <ResultGroup title="Blog Posts" results={posts} />
            <ResultGroup title="Projects" results={projects} />
            <ResultGroup title="Hub" results={[...hubTopics, ...hubItems]} />
            <ResultGroup title="Reels" results={reels} />
            <ResultGroup title="Videos" results={videos} />
          </div>
        )}
      </main>
    </>
  )
}
