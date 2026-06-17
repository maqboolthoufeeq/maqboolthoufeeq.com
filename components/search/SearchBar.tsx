'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, X, Loader2, ArrowRight } from 'lucide-react'
import type { SearchResult } from '@/lib/search'

export default function SearchBar() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const router = useRouter()

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  function close() {
    setOpen(false)
    setQuery('')
    setResults([])
    setActiveIdx(-1)
    clearTimeout(timerRef.current)
  }

  const doSearch = useCallback((q: string) => {
    clearTimeout(timerRef.current)
    if (q.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`)
        const data: { results: SearchResult[] } = await res.json()
        setResults(data.results ?? [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)
  }, [])

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    setActiveIdx(-1)
    doSearch(v)
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    if (activeIdx >= 0 && activeIdx < results.length) {
      router.push(results[activeIdx].href)
    } else {
      router.push(`/search?q=${encodeURIComponent(q)}`)
    }
    close()
  }

  function onKey(e: React.KeyboardEvent) {
    const total = results.length + (results.length > 0 ? 1 : 0) // +1 for "see all"
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, total - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      close()
    } else if (e.key === 'Enter' && activeIdx === results.length && results.length > 0) {
      e.preventDefault()
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      close()
    }
  }

  const hasQuery = query.trim().length >= 2
  const showResults = open && hasQuery

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button — always visible */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open search"
        title="Search"
        className={`p-1.5 rounded-lg transition-all ${
          open
            ? 'text-[var(--foreground)] bg-[var(--surface)]'
            : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]'
        }`}
      >
        <Search size={16} />
      </button>

      {open && (
        <>
          {/* Backdrop — full-screen on mobile, partial fade on desktop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
            onClick={close}
            aria-hidden
          />

          {/* Search panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Site search"
            className={[
              /* mobile: full-width strip pinned to the top of the viewport */
              'fixed left-0 right-0 top-0 z-50',
              /* desktop: absolute card below the trigger */
              'sm:absolute sm:top-full sm:left-auto sm:right-0 sm:mt-2 sm:rounded-xl sm:w-80 sm:max-h-[80vh]',
              'bg-[var(--background)] border-b sm:border border-[var(--border)] sm:shadow-xl',
              'flex flex-col',
            ].join(' ')}
          >
            {/* Input row */}
            <form
              onSubmit={onSubmit}
              className="flex items-center gap-2 h-14 px-4 sm:px-3 sm:pt-3 sm:pb-2 sm:h-auto shrink-0"
            >
              <Search
                size={15}
                className="shrink-0 text-[var(--muted)]"
                aria-hidden
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={onChange}
                onKeyDown={onKey}
                placeholder="Search anything…"
                autoComplete="off"
                spellCheck={false}
                aria-label="Search query"
                aria-autocomplete="list"
                aria-controls="search-results"
                className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none"
              />
              {loading && (
                <Loader2
                  size={14}
                  className="shrink-0 text-[var(--muted)] animate-spin"
                  aria-label="Searching…"
                />
              )}
              {query && !loading && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
                  aria-label="Clear"
                  className="shrink-0 p-0.5 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={close}
                aria-label="Close search"
                className="shrink-0 sm:hidden p-0.5 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <span className="text-xs font-medium">Cancel</span>
              </button>
            </form>

            {/* Results */}
            {showResults && (
              <div
                id="search-results"
                role="listbox"
                aria-label="Search results"
                className="border-t border-[var(--border)] overflow-y-auto max-h-[calc(100dvh-56px)] sm:max-h-[420px]"
              >
                {results.length > 0 ? (
                  <>
                    <ul>
                      {results.map((r, i) => (
                        <li key={r.id} role="option" aria-selected={i === activeIdx}>
                          <Link
                            href={r.href}
                            onClick={close}
                            className={[
                              'flex items-start gap-3 px-4 py-2.5 text-sm transition-colors',
                              i === activeIdx
                                ? 'bg-[var(--surface)]'
                                : 'hover:bg-[var(--surface)]',
                            ].join(' ')}
                          >
                            <span className="shrink-0 mt-0.5 inline-flex items-center text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--muted)] bg-[var(--surface)] uppercase">
                              {r.icon ? `${r.icon} ` : ''}{r.badge}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block font-medium text-[var(--foreground)] truncate">
                                {r.title}
                              </span>
                              {r.excerpt && (
                                <span className="block text-xs text-[var(--muted)] mt-0.5 line-clamp-1">
                                  {r.excerpt}
                                </span>
                              )}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-[var(--border)] px-4 py-2.5">
                      <Link
                        href={`/search?q=${encodeURIComponent(query)}`}
                        onClick={close}
                        className={[
                          'flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:underline transition-colors',
                          activeIdx === results.length ? 'underline' : '',
                        ].join(' ')}
                      >
                        <ArrowRight size={12} aria-hidden />
                        See all results for &ldquo;{query}&rdquo;
                      </Link>
                    </div>
                  </>
                ) : !loading ? (
                  <p className="px-4 py-4 text-sm text-[var(--muted)]">
                    No results for &ldquo;{query}&rdquo;
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
