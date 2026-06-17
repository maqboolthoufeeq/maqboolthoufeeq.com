import Link from 'next/link'
import { Search } from 'lucide-react'
import Navbar from '@/components/Navbar'
import SearchResults from '@/components/search/SearchResults'
import { search } from '@/lib/search'
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

export default async function SearchPage({ searchParams }: Props) {
  const { q = '' } = await searchParams
  const query = q.trim()

  const { results, total } = query.length >= 2
    ? await search(query, 50)
    : { results: [], total: 0 }

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
        <form action="/search" method="get" className="mb-6">
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
          <SearchResults results={results} />
        )}
      </main>
    </>
  )
}
