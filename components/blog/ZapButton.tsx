'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Zap } from 'lucide-react'

type ZapState = {
  zaps: number
  zapped: boolean
  pending: boolean
  zap: () => void
}

const ZapContext = createContext<ZapState | null>(null)

/**
 * Holds the zap state for a post so multiple ZapButtons (top + bottom of the
 * article) stay in sync. Increments a server counter, and remembers in
 * localStorage that this browser already zapped — one zap per person.
 */
export function ZapProvider({
  slug,
  initialZaps,
  children,
}: {
  slug: string
  initialZaps: number
  children: ReactNode
}) {
  const [zaps, setZaps] = useState(initialZaps)
  const [zapped, setZapped] = useState(false)
  const [pending, setPending] = useState(false)
  const storageKey = `zapped:${slug}`
  // Synchronous guard: state updates are async, so a rapid double-click could
  // slip two requests past the `pending` state check before React flushes.
  const inFlight = useRef(false)

  useEffect(() => {
    try {
      setZapped(localStorage.getItem(storageKey) === '1')
    } catch {
      /* localStorage unavailable — allow zapping without persistence */
    }
  }, [storageKey])

  const zap = useCallback(async () => {
    if (zapped || inFlight.current) return
    inFlight.current = true
    setPending(true)
    setZapped(true)
    setZaps((n) => n + 1) // optimistic
    try {
      localStorage.setItem(storageKey, '1')
    } catch {
      /* ignore */
    }

    try {
      const res = await fetch(`/api/blog/${slug}/zap`, { method: 'POST' })
      if (!res.ok) throw new Error('zap failed')
      const data = (await res.json()) as { zaps: number }
      setZaps(data.zaps)
    } catch {
      setZapped(false)
      setZaps((n) => Math.max(0, n - 1))
      try {
        localStorage.removeItem(storageKey)
      } catch {
        /* ignore */
      }
    } finally {
      setPending(false)
      inFlight.current = false
    }
  }, [zapped, slug, storageKey])

  return (
    <ZapContext.Provider value={{ zaps, zapped, pending, zap }}>
      {children}
    </ZapContext.Provider>
  )
}

const SIZES = {
  md: { pad: 'py-1.5 pl-3 pr-1.5', text: 'text-sm', icon: 16, count: 'text-xs min-w-[1.5rem]' },
  lg: { pad: 'py-2.5 pl-4 pr-2.5', text: 'text-base', icon: 20, count: 'text-sm min-w-[1.75rem]' },
} as const

export default function ZapButton({ size = 'md' }: { size?: keyof typeof SIZES }) {
  const ctx = useContext(ZapContext)
  const [pop, setPop] = useState(false)

  if (!ctx) return null
  const { zaps, zapped, pending, zap } = ctx
  const s = SIZES[size]

  function handleClick() {
    if (zapped || pending) return
    setPop(true)
    window.setTimeout(() => setPop(false), 350)
    zap()
  }

  const legend = zapped ? 'Thanks for the zap!' : 'Zap if this helped'

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        onClick={handleClick}
        disabled={zapped || pending}
        aria-pressed={zapped}
        aria-label={
          zapped
            ? `You found this post helpful — ${zaps} ${zaps === 1 ? 'zap' : 'zaps'}`
            : `Zap this post if it was helpful — ${zaps} ${zaps === 1 ? 'zap' : 'zaps'} so far`
        }
        className={[
          'inline-flex items-center gap-2 rounded-full border font-medium select-none',
          'transition-all duration-200 active:scale-95',
          s.pad,
          s.text,
          zapped
            ? 'border-transparent bg-[var(--accent)] text-white shadow-[0_4px_14px_-4px_var(--accent)] cursor-default'
            : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] group-hover:border-[var(--accent)] group-hover:text-[var(--accent)] group-hover:-translate-y-0.5 group-hover:shadow-[0_6px_16px_-8px_var(--accent)] cursor-pointer',
        ].join(' ')}
      >
        <Zap
          size={s.icon}
          strokeWidth={2.25}
          className={[
            'transition-transform duration-300 ease-out',
            zapped ? 'fill-current' : '',
            pop ? 'scale-150 -rotate-12' : 'scale-100 rotate-0',
          ].join(' ')}
        />
        <span
          className={[
            'inline-flex items-center justify-center rounded-full px-2 py-0.5 tabular-nums font-semibold',
            s.count,
            zapped ? 'bg-white/20 text-white' : 'bg-[var(--background)] text-[var(--foreground)]',
          ].join(' ')}
        >
          {zaps}
        </span>
      </button>
      <span
        role="tooltip"
        aria-hidden="true"
        className="pointer-events-none absolute bottom-full left-1/2 mb-2 max-w-[calc(100vw-1.5rem)] -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-[var(--foreground)] px-2.5 py-1 text-xs font-medium text-[var(--background)] opacity-0 shadow-md transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
      >
        {legend}
      </span>
    </span>
  )
}
