'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { DESIGNS } from '@/lib/designs'

const INNER_W = 1024
const INNER_H = 620

const PROJECTS = [
  { title: 'Project Alpha', tech: 'Next.js · TypeScript · Prisma', accent: true },
  { title: 'Project Beta', tech: 'React · Node.js · PostgreSQL', accent: false },
  { title: 'Project Gamma', tech: 'Vue · FastAPI · Redis', accent: false },
]

function PreviewContent() {
  return (
    <div className="bg-[var(--background)] dark" style={{ height: INNER_H, fontFamily: 'inherit' }}>
      {/* Nav */}
      <header className="h-14 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between px-8">
        <span className="font-bold text-[var(--foreground)] text-base">Maqbool Thoufeeq</span>
        <nav className="flex items-center gap-8">
          {['About', 'Projects', 'Blog', 'Contact'].map(item => (
            <span key={item} className="text-sm text-[var(--muted)]">{item}</span>
          ))}
        </nav>
      </header>

      {/* Hero */}
      <div className="px-8 pt-10 pb-8">
        <p className="text-sm text-[var(--muted)] mb-2 tracking-wide">Full-Stack Developer</p>
        <h1 className="text-5xl font-bold text-[var(--foreground)] mb-4 leading-tight">
          Hi, I&apos;m Maqbool
        </h1>
        <p className="text-lg text-[var(--muted)] mb-7 max-w-lg">
          I build fast, beautiful web products with a focus on great user experience.
        </p>
        <div className="flex items-center gap-3 mb-10">
          <button className="px-5 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium">
            View Projects
          </button>
          <button className="px-5 py-2 rounded-lg border border-[var(--border)] text-[var(--muted)] text-sm">
            Contact
          </button>
        </div>

        {/* Project cards */}
        <div className="grid grid-cols-3 gap-5">
          {PROJECTS.map(p => (
            <article
              key={p.title}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
            >
              <div
                className="h-24"
                style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)' }}
              />
              <div className="p-4">
                <h3 className="font-semibold text-[var(--foreground)] text-sm mb-1">{p.title}</h3>
                <p className="text-xs text-[var(--muted)] mb-3">{p.tech}</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[var(--accent)] text-white text-xs">
                    Live
                  </span>
                  <span className="px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)] text-xs">
                    Code
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

function SitePreview({ designId, thumb = false }: { designId: string; thumb?: boolean }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(thumb ? 0.18 : 0.6)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const update = () => setScale(el.offsetWidth / INNER_W)
    update()
    const obs = new ResizeObserver(update)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={wrapperRef}
      style={{ aspectRatio: `${INNER_W} / ${INNER_H}`, overflow: 'hidden', position: 'relative' }}
    >
      <div
        data-design={designId}
        style={{
          width: INNER_W,
          height: INNER_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      >
        <PreviewContent />
      </div>
    </div>
  )
}

export default function DesignPicker({ activeId }: { activeId: string }) {
  const router = useRouter()
  const [current, setCurrent] = useState(activeId)
  const [staged, setStaged] = useState(activeId)
  const [pending, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)

  const stagedDesign = DESIGNS.find(d => d.id === staged) ?? DESIGNS[0]
  const isChanged = staged !== current

  async function apply() {
    if (!isChanged || saving) return
    setSaving(true)
    const res = await fetch('/api/admin/design', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: staged }),
    })
    setSaving(false)
    if (res.ok) {
      setCurrent(staged)
      startTransition(() => router.refresh())
    }
  }

  return (
    <div className="space-y-4">
      {/* Large preview panel */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold text-sm text-[var(--foreground)]">{stagedDesign.name}</p>
            <p className="text-xs text-[var(--muted)] truncate">{stagedDesign.description}</p>
          </div>
          <button
            onClick={apply}
            disabled={!isChanged || saving || pending}
            className={`shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-all disabled:cursor-not-allowed ${
              !isChanged
                ? 'bg-[var(--border)] text-[var(--muted)] opacity-60'
                : 'bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50'
            }`}
          >
            {saving ? 'Applying…' : !isChanged ? 'Applied' : 'Apply design'}
          </button>
        </div>
        <SitePreview designId={staged} />
      </div>

      {/* Thumbnail grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {DESIGNS.map(design => {
          const isStaged = staged === design.id
          const isSaved = current === design.id

          return (
            <button
              key={design.id}
              onClick={() => setStaged(design.id)}
              disabled={saving || pending}
              className={`group relative text-left rounded-xl border-2 overflow-hidden transition-all focus:outline-none disabled:cursor-wait ${
                isStaged
                  ? 'border-[var(--accent)] shadow-lg shadow-[var(--accent)]/10'
                  : 'border-[var(--border)] hover:border-[var(--accent)]/50'
              }`}
            >
              <SitePreview designId={design.id} thumb />
              <div className="px-3 py-2 bg-[var(--surface)] flex items-center justify-between gap-2">
                <p className={`font-semibold text-xs truncate ${isStaged ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'}`}>
                  {design.name}
                </p>
                {isSaved && (
                  <span className="shrink-0 w-4 h-4 rounded-full bg-[var(--accent)] flex items-center justify-center">
                    <Check size={9} className="text-white" />
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-[var(--muted)]">
        Click a design to preview it above, then hit{' '}
        <span className="font-medium text-[var(--foreground)]">Apply design</span> to save.
      </p>
    </div>
  )
}
