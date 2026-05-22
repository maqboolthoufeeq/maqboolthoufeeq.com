'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Code2, ExternalLink, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'

type Tag = { id: string; name: string }
export type ProjectItem = {
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

const TECH_LIMIT = 3

export default function ProjectsGrid({ projects }: { projects: ProjectItem[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selected, setSelected] = useState<ProjectItem | null>(null)
  const [imgIdx, setImgIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const allImages = selected
    ? ([selected.imageUrl, ...(selected.images ?? [])].filter(Boolean) as string[])
    : []

  // Open/close modal based on URL
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

  const openProject = useCallback(
    (p: ProjectItem) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('project', p.id)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  const closeModal = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('project')
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    setLightbox(false)
  }, [router, pathname, searchParams])

  // Keyboard navigation
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

  // Lock body scroll when modal or lightbox is open
  useEffect(() => {
    document.body.style.overflow = selected || lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selected, lightbox])

  return (
    <>
      {/* ── Grid ─────────────────────────────────────────────────── */}
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => {
          const extraTech = Math.max(0, p.tech.length - TECH_LIMIT)
          return (
            <li
              key={p.id}
              onClick={() => openProject(p)}
              className="cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col hover:border-[var(--accent)] transition-colors"
            >
              {p.imageUrl && (
                <div className="relative h-40 w-full bg-[var(--background)]">
                  <Image src={p.imageUrl} alt={p.title} fill className="object-cover" unoptimized />
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-semibold text-[var(--foreground)] mb-1">{p.title}</h3>
                <p className="text-sm text-[var(--muted)] mb-4 flex-1 line-clamp-3">{p.description}</p>

                {p.tech.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.tech.slice(0, TECH_LIMIT).map((t, i) => (
                      <span key={`${t}-${i}`} className="text-xs px-2 py-0.5 rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--muted)]">
                        {t}
                      </span>
                    ))}
                    {extraTech > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] font-medium">
                        +{extraTech}
                      </span>
                    )}
                  </div>
                )}

                {p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.tags.map((tag) => (
                      <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full border border-[var(--accent)] text-[var(--accent)]">
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                  {p.liveUrl && (
                    <Link href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-[var(--accent)] hover:underline">
                      <ExternalLink size={14} /> Live
                    </Link>
                  )}
                  {p.repoUrl && (
                    <Link href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
                      <Code2 size={14} /> Code
                    </Link>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {/* ── Project modal ─────────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-3 left-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
            >
              <X size={16} />
            </button>
            {allImages.length > 0 && (
              <div>
                {/* Main image — click to enter lightbox */}
                <div
                  className="relative h-72 w-full bg-black rounded-t-2xl overflow-hidden cursor-zoom-in group"
                  onClick={() => setLightbox(true)}
                >
                  <Image
                    src={allImages[imgIdx]}
                    alt={selected.title}
                    fill
                    className="object-contain"
                    unoptimized
                  />

                  {/* Expand hint */}
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

            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="text-xl font-bold text-[var(--foreground)]">{selected.title}</h2>
                <button onClick={closeModal} className="text-[var(--muted)] hover:text-[var(--foreground)] flex-shrink-0 transition-colors">
                  <X size={20} />
                </button>
              </div>

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
                <div className="mb-5">
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

              {(selected.liveUrl || selected.repoUrl) && (
                <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
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
        </div>
      )}

      {/* ── Lightbox ──────────────────────────────────────────────── */}
      {lightbox && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-[60] bg-black/96 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors z-10"
          >
            <X size={24} />
          </button>

          {/* Prev / Next */}
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

          {/* Full image */}
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

          {/* Thumbnail strip */}
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
