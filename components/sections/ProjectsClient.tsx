'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Code2, ExternalLink, LayoutGrid, List } from 'lucide-react'

type Tag = { id: string; name: string }
type Project = {
  id: string
  title: string
  description: string
  tech: string[]
  imageUrl: string | null
  liveUrl: string | null
  repoUrl: string | null
  tags: Tag[]
}

function ProjectLinks({ p }: { p: Project }) {
  return (
    <div className="flex gap-3">
      {p.liveUrl && (
        <Link
          href={p.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={14} /> Live
        </Link>
      )}
      {p.repoUrl && (
        <Link
          href={p.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          onClick={(e) => e.stopPropagation()}
        >
          <Code2 size={14} /> Code
        </Link>
      )}
    </div>
  )
}

function TechTags({ tech, tags }: { tech: string[]; tags: Tag[] }) {
  return (
    <>
      {tech.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tech.map((t) => (
            <span
              key={t}
              className="text-xs px-2 py-0.5 rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--muted)]"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="text-xs px-2 py-0.5 rounded-full border border-[var(--accent)] text-[var(--accent)]"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}
    </>
  )
}

export default function ProjectsClient({
  projects,
  allTags,
}: {
  projects: Project[]
  allTags: Tag[]
}) {
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const q = query.trim().toLowerCase()
  const filtered = projects.filter((p) => {
    const matchesQ = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    const matchesTag = !activeTag || p.tags.some((t) => t.id === activeTag)
    return matchesQ && matchesTag
  })

  const hasFilter = query || activeTag

  return (
    <div>
      {/* Search bar — matches blog search style */}
      <div className="space-y-4 mb-10">
        <div className="flex items-center gap-2">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex gap-2 flex-1"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects…"
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              Search
            </button>
            {hasFilter && (
              <button
                type="button"
                onClick={() => { setQuery(''); setActiveTag('') }}
                className="px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] rounded-lg border border-[var(--border)] transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </form>

          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] p-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setView('list')}
              title="List view"
              className={`p-1.5 rounded cursor-pointer transition-colors ${
                view === 'list'
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => setView('grid')}
              title="Grid view"
              className={`p-1.5 rounded cursor-pointer transition-colors ${
                view === 'grid'
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {/* Tag pills */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setActiveTag(activeTag === tag.id ? '' : tag.id)}
                className={[
                  'text-xs px-3 py-1 rounded-full border transition-colors cursor-pointer',
                  activeTag === tag.id
                    ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10'
                    : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]',
                ].join(' ')}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-[var(--muted)]">No projects match your search.</p>
      ) : view === 'grid' ? (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col hover:border-[var(--accent)] transition-colors"
            >
              {p.imageUrl && (
                <div className="relative h-40 w-full bg-[var(--background)]">
                  <Image src={p.imageUrl} alt={p.title} fill className="object-cover" unoptimized />
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-semibold text-[var(--foreground)] mb-1">{p.title}</h3>
                <p className="text-sm text-[var(--muted)] mb-4 flex-1">{p.description}</p>
                <TechTags tech={p.tech} tags={p.tags} />
                <ProjectLinks p={p} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-6">
          {filtered.map((p, i) => {
            const imageRight = i % 2 !== 0
            return (
              <li
                key={p.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--accent)] transition-colors"
              >
                <div className={`flex flex-col sm:flex-row${imageRight ? ' sm:flex-row-reverse' : ''}`}>
                  {p.imageUrl ? (
                    <div className="relative h-48 sm:h-auto sm:w-64 flex-shrink-0">
                      <Image src={p.imageUrl} alt={p.title} fill className="object-cover" unoptimized />
                    </div>
                  ) : null}
                  <div className="p-5 flex flex-col justify-center flex-1">
                    <h3 className="font-semibold text-[var(--foreground)] mb-1">{p.title}</h3>
                    <p className="text-sm text-[var(--muted)] mb-4">{p.description}</p>
                    <TechTags tech={p.tech} tags={p.tags} />
                    <ProjectLinks p={p} />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
