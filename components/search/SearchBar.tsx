'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, X, Loader2, ArrowRight } from 'lucide-react'
import type { SearchResult } from '@/lib/search'

const BADGE_COLORS: Record<string, string> = {
  Blog: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
  Project: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
  Hub: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 border-violet-200 dark:border-violet-800',
  Reel: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
  Video: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800',
}

const BADGE_ICONS: Record<string, string> = {
  Blog: '📝', Project: '🚀', Hub: '🔗', Reel: '🎬', Video: '▶️',
}

function ResultItem({
  result,
  active,
  onClose,
  mobile,
}: {
  result: SearchResult
  active: boolean
  onClose: () => void
  mobile?: boolean
}) {
  return (
    <Link
      href={result.href}
      onClick={onClose}
      className={`flex items-center gap-3 ${mobile ? 'px-4 py-3' : 'px-3 py-2.5'} text-sm transition-colors ${
        active ? 'bg-[var(--surface)]' : 'hover:bg-[var(--surface)]'
      }`}
    >
      {/* Thumbnail or icon placeholder */}
      <span className={`shrink-0 ${mobile ? 'w-10 h-10' : 'w-9 h-9'} rounded-md overflow-hidden bg-[var(--surface)] flex items-center justify-center`}>
        {result.imageUrl ? (
          <img
            src={result.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <span className="text-base leading-none select-none">
            {result.icon ?? BADGE_ICONS[result.badge] ?? '📄'}
          </span>
        )}
      </span>

      <span className="flex-1 min-w-0">
        <span className={`block font-medium text-[var(--foreground)] truncate ${mobile ? 'text-sm' : 'text-[13px]'} leading-snug`}>
          {result.title}
        </span>
        <span className={`inline-flex items-center mt-0.5 text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded border uppercase ${BADGE_COLORS[result.badge] ?? 'text-[var(--muted)] bg-[var(--surface)] border-[var(--border)]'}`}>
          {result.badge}
        </span>
        {mobile && result.excerpt && (
          <span className="block text-xs text-[var(--muted)] mt-0.5 line-clamp-1">
            {result.excerpt}
          </span>
        )}
      </span>
    </Link>
  )
}

export default function SearchBar() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const router = useRouter()

  // Focus the visible input when panel opens
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      if (window.innerWidth >= 640) {
        desktopInputRef.current?.focus()
      } else {
        mobileInputRef.current?.focus()
      }
    }, 60)
    return () => clearTimeout(t)
  }, [open])

  // Close on outside click (desktop only — mobile uses Cancel / backdrop)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Lock body scroll on mobile when panel is open
  useEffect(() => {
    if (open && window.innerWidth < 640) {
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
    setLoading(false)
  }

  function clearQuery() {
    setQuery('')
    setResults([])
    setActiveIdx(-1)
    clearTimeout(timerRef.current)
    setLoading(false)
    desktopInputRef.current?.focus()
    mobileInputRef.current?.focus()
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
    const total = results.length + (results.length > 0 ? 1 : 0)
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
  const showDropdown = open && hasQuery

  const sharedInputProps = {
    type: 'text' as const,
    value: query,
    onChange,
    onKeyDown: onKey,
    placeholder: 'Search anything…',
    autoComplete: 'off',
    spellCheck: false as const,
    'aria-label': 'Search query',
    'aria-autocomplete': 'list' as const,
    'aria-controls': 'search-results',
    className: 'flex-1 min-w-0 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none',
  }

  return (
    <>
      {/* Aura CSS — injected once */}
      <style>{`
        @keyframes search-aura-pulse {
          0%, 100% {
            box-shadow:
              0 0 0 2px color-mix(in srgb, var(--accent) 18%, transparent),
              0 0 8px  color-mix(in srgb, var(--accent) 10%, transparent);
          }
          50% {
            box-shadow:
              0 0 0 4px color-mix(in srgb, var(--accent) 30%, transparent),
              0 0 20px color-mix(in srgb, var(--accent) 20%, transparent);
          }
        }
        .search-btn-idle {
          animation: search-aura-pulse 2.8s ease-in-out infinite;
          border-radius: 8px;
        }
        .search-btn-active {
          box-shadow:
            0 0 0 3px color-mix(in srgb, var(--accent) 38%, transparent),
            0 0 24px color-mix(in srgb, var(--accent) 28%, transparent);
          border-radius: 8px;
        }
        .search-panel-glow {
          box-shadow:
            0 0 0 1px color-mix(in srgb, var(--accent) 22%, transparent),
            0 4px 28px color-mix(in srgb, var(--accent) 14%, transparent),
            0 2px 8px rgba(0,0,0,0.08);
        }
        .search-mobile-panel {
          border-bottom: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
          box-shadow:
            0 4px 32px color-mix(in srgb, var(--accent) 18%, transparent),
            0 2px 12px color-mix(in srgb, var(--accent) 10%, transparent),
            0 1px 0 0  color-mix(in srgb, var(--accent) 22%, transparent);
        }
        .search-mobile-input {
          box-shadow:
            0 0 0 1px color-mix(in srgb, var(--accent) 28%, transparent),
            0 2px 12px color-mix(in srgb, var(--accent) 14%, transparent);
        }
      `}</style>

      <div ref={containerRef} className="relative flex items-center">

        {/* ── Desktop: expanding inline input bar (grows LEFT of the icon) ── */}
        <div
          style={{
            width: open ? '224px' : '0px',
            opacity: open ? 1 : 0,
            overflow: 'hidden',
            transition: 'width 320ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease',
            pointerEvents: open ? 'auto' : 'none',
          }}
          className="hidden sm:flex items-center"
        >
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-1.5 w-full h-8 px-3 mr-1.5 rounded-lg border border-[var(--accent)]/30 bg-[var(--surface)] search-panel-glow"
          >
            <Search size={13} className="shrink-0 text-[var(--muted)]" aria-hidden />
            <input ref={desktopInputRef} {...sharedInputProps} />
            {loading && <Loader2 size={13} className="shrink-0 text-[var(--muted)] animate-spin" aria-label="Searching…" />}
            {query && !loading && (
              <button type="button" onClick={clearQuery} aria-label="Clear" className="shrink-0 p-0.5 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                <X size={13} />
              </button>
            )}
          </form>
        </div>

        {/* ── Icon button — always visible, always glowing ── */}
        <button
          onClick={() => setOpen(v => !v)}
          aria-label={open ? 'Close search' : 'Open search'}
          title="Search"
          className={`p-1.5 transition-colors ${
            open
              ? 'text-[var(--accent)] search-btn-active'
              : 'text-[var(--muted)] hover:text-[var(--foreground)] search-btn-idle'
          }`}
        >
          <Search size={16} />
        </button>

        {/* ── Desktop dropdown ── */}
        {showDropdown && (
          <div
            id="search-results"
            role="listbox"
            aria-label="Search results"
            className="hidden sm:flex flex-col absolute top-full right-0 mt-2 w-80 max-h-[480px] rounded-xl border border-[var(--border)] bg-[var(--background)] overflow-hidden search-panel-glow z-50"
          >
            {results.length > 0 ? (
              <>
                <ul className="overflow-y-auto flex-1">
                  {results.map((r, i) => (
                    <li key={r.id} role="option" aria-selected={i === activeIdx}>
                      <ResultItem result={r} active={i === activeIdx} onClose={close} />
                    </li>
                  ))}
                </ul>
                <div className="border-t border-[var(--border)] px-3 py-2.5 shrink-0">
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}`}
                    onClick={close}
                    className={`flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:underline ${activeIdx === results.length ? 'underline' : ''}`}
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
            ) : (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={16} className="text-[var(--muted)] animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* ── Mobile backdrop ── */}
        {open && (
          <div
            className="sm:hidden fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
            onClick={close}
            aria-hidden
          />
        )}

        {/* ── Mobile full-screen panel ── */}
        {open && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Site search"
            className="sm:hidden fixed left-0 right-0 top-0 z-50 bg-[var(--background)] flex flex-col search-mobile-panel"
          >
            <form
              onSubmit={onSubmit}
              className="flex items-center gap-2 h-14 px-4 shrink-0"
            >
              <div className="flex flex-1 items-center gap-2 h-9 px-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--surface)] search-mobile-input">
                <Search size={15} className="shrink-0 text-[var(--muted)]" aria-hidden />
                <input ref={mobileInputRef} {...sharedInputProps} />
                {loading && <Loader2 size={14} className="shrink-0 text-[var(--muted)] animate-spin" aria-label="Searching…" />}
                {query && !loading && (
                  <button type="button" onClick={clearQuery} aria-label="Clear" className="shrink-0 p-0.5 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
              <button type="button" onClick={close} className="shrink-0 text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                Cancel
              </button>
            </form>

            {hasQuery && (
              <div
                id="search-results"
                role="listbox"
                aria-label="Search results"
                className="border-t border-[var(--accent)]/20 overflow-y-auto max-h-[calc(100dvh-56px)]"
              >
                {results.length > 0 ? (
                  <>
                    <ul>
                      {results.map((r, i) => (
                        <li key={r.id} role="option" aria-selected={i === activeIdx}>
                          <ResultItem result={r} active={i === activeIdx} onClose={close} mobile />
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-[var(--border)] px-4 py-3">
                      <Link
                        href={`/search?q=${encodeURIComponent(query)}`}
                        onClick={close}
                        className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:underline"
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
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="text-[var(--muted)] animate-spin" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
