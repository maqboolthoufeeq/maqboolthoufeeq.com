'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Code2, ExternalLink, X, ChevronLeft, ChevronRight, ChevronDown, Maximize2 } from 'lucide-react'

type Tag = { id: string; name: string }

export type ProjectDetail = {
  id: string
  title: string
  description: string
  tech: string[]
  liveUrl: string | null
  repoUrl: string | null
  imageUrl: string | null
  images: string[]
  tags: Tag[]
}

/**
 * Returns a stable `openProject(id)` that drives the detail modal via the
 * `?project=<id>` query param, so the modal state lives in the URL (shareable,
 * back-button friendly). Used by every project list/grid on the site.
 */
export function useOpenProject() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('project', id)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )
}

/**
 * Self-contained project detail modal + image lightbox. Reads the active
 * project id from `?project=` and renders nothing when absent. Drop one instance
 * alongside any list that uses `useOpenProject()`.
 */
export default function ProjectDetailModal({ projects }: { projects: ProjectDetail[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selected, setSelected] = useState<ProjectDetail | null>(null)
  const [imgIdx, setImgIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const allImages = selected
    ? ([selected.imageUrl, ...(selected.images ?? [])].filter(Boolean) as string[])
    : []

  // True while the center section has more content below the fold.
  const updateScrollHint = useCallback(() => {
    const el = scrollRef.current
    setCanScrollDown(!!el && el.scrollTop + el.clientHeight < el.scrollHeight - 8)
  }, [])

  const scrollDown = () => {
    const el = scrollRef.current
    if (el) el.scrollBy({ top: el.clientHeight * 0.8, behavior: 'smooth' })
  }

  // Open/close based on URL.
  useEffect(() => {
    const id = searchParams.get('project')
    if (id) {
      const found = projects.find((p) => p.id === id)
      if (found) {
        setSelected(found)
        setImgIdx(0)
      } else {
        setSelected(null)
      }
    } else {
      setSelected(null)
      setLightbox(false)
    }
  }, [searchParams, projects])

  const closeModal = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('project')
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    setLightbox(false)
  }, [router, pathname, searchParams])

  // Keyboard navigation.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (lightbox) { setLightbox(false); return }
        if (selected) closeModal()
        return
      }
      if (lightbox && allImages.length > 1) {
        if (e.key === 'ArrowLeft') setImgIdx((i) => (i - 1 + allImages.length) % allImages.length)
        if (e.key === 'ArrowRight') setImgIdx((i) => (i + 1) % allImages.length)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, lightbox, allImages.length, closeModal])

  // Lock body scroll when modal or lightbox is open.
  useEffect(() => {
    document.body.style.overflow = selected || lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selected, lightbox])

  // Reset scroll to top and re-evaluate the "more below" hint when the open
  // project changes; keep it accurate across viewport resizes too.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = 0
    updateScrollHint()
  }, [selected, updateScrollHint])

  useEffect(() => {
    window.addEventListener('resize', updateScrollHint)
    return () => window.removeEventListener('resize', updateScrollHint)
  }, [updateScrollHint])

  if (!selected) return null

  // Sibling navigation — move to the prev/next project in the list (wraps).
  const idx = projects.findIndex((p) => p.id === selected.id)
  const hasSiblings = projects.length > 1
  const goToProject = (i: number) => {
    const target = projects[(i + projects.length) % projects.length]
    const params = new URLSearchParams(searchParams.toString())
    params.set('project', target.id)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <>
      {/* ── Project modal ─────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={closeModal}
      >
        {/* Previous / next PROJECT navigation — round arrows, icon only */}
        {hasSiblings && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goToProject(idx - 1) }}
              aria-label="Previous project"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-[55] w-10 h-10 flex items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] shadow-lg hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goToProject(idx + 1) }}
              aria-label="Next project"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-[55] w-10 h-10 flex items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] shadow-lg hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        <div
          className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={closeModal}
            aria-label="Close"
            className="absolute top-3 left-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
          >
            <X size={16} />
          </button>

          {/* Static image header */}
          {allImages.length > 0 && (
            <div className="shrink-0">
              <div
                className="relative h-72 w-full bg-black rounded-t-2xl overflow-hidden cursor-zoom-in group"
                onClick={() => setLightbox(true)}
              >
                <Image src={allImages[imgIdx]} alt={selected.title} fill className="object-contain" unoptimized />

                <div className="absolute top-2 right-2 w-7 h-7 bg-black/40 group-hover:bg-black/60 text-white rounded-lg flex items-center justify-center transition-colors">
                  <Maximize2 size={13} />
                </div>

                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i - 1 + allImages.length) % allImages.length) }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i + 1) % allImages.length) }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <div className="absolute bottom-2 right-3 text-xs text-white/70 bg-black/40 rounded-full px-2 py-0.5">
                      {imgIdx + 1} / {allImages.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail strip */}
              {allImages.length > 1 && (
                <div className="flex gap-2 px-5 pt-3 pb-1 overflow-x-auto">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        i === imgIdx ? 'border-[var(--accent)]' : 'border-transparent opacity-50 hover:opacity-80'
                      }`}
                    >
                      <Image src={img} alt="" fill className="object-cover" unoptimized />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Scrollable center — only this region scrolls */}
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              ref={scrollRef}
              onScroll={updateScrollHint}
              className={`min-h-0 flex-1 overflow-y-auto no-scrollbar p-6 ${allImages.length === 0 ? 'pt-14' : ''}`}
            >
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">{selected.title}</h2>

              <p className="text-sm text-[var(--muted)] mb-5 leading-relaxed whitespace-pre-line">{selected.description}</p>

              {selected.tech.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-[var(--muted)] mb-2 font-medium uppercase tracking-wider">Tech Stack</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.tech.map((t, i) => (
                      <span key={`${t}-${i}`} className="text-xs px-2 py-0.5 rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--muted)]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selected.tags.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--muted)] mb-2 font-medium uppercase tracking-wider">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.tags.map((tag) => (
                      <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full border border-[var(--accent)] text-[var(--accent)]">
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* "More below" affordance — bottom-right of the center, scrolls content down */}
            {canScrollDown && (
              <button
                type="button"
                onClick={scrollDown}
                aria-label="Scroll down for more"
                className="animate-nudge-down absolute bottom-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]/90 text-[var(--muted)] shadow-sm backdrop-blur-sm transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <ChevronDown size={15} />
              </button>
            )}
          </div>

          {/* Static footer — action buttons stay visible while the center scrolls */}
          {(selected.liveUrl || selected.repoUrl) && (
            <div className="shrink-0 flex gap-3 border-t border-[var(--border)] bg-[var(--surface)] px-6 py-4">
              {selected.liveUrl && (
                <Link href={selected.liveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity">
                  <ExternalLink size={14} /> Live demo
                </Link>
              )}
              {selected.repoUrl && (
                <Link href={selected.repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm px-4 py-2 border border-[var(--border)] text-[var(--muted)] rounded-lg hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                  <Code2 size={14} /> View code
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Lightbox ──────────────────────────────────────────────── */}
      {lightbox && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-[60] bg-black/96 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors z-10"
          >
            <X size={24} />
          </button>

          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i - 1 + allImages.length) % allImages.length) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center z-10"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i + 1) % allImages.length) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center z-10"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          <div
            className="relative w-full h-full max-w-5xl max-h-[calc(100vh-96px)] mx-auto flex items-center justify-center px-16 py-8"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={allImages[imgIdx]}
              alt={selected?.title ?? ''}
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          {allImages.length > 1 && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 max-w-[90vw] overflow-x-auto pb-1"
              onClick={(e) => e.stopPropagation()}
            >
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`relative flex-shrink-0 w-14 h-9 rounded overflow-hidden border-2 transition-all ${
                    i === imgIdx ? 'border-white' : 'border-transparent opacity-40 hover:opacity-70'
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
