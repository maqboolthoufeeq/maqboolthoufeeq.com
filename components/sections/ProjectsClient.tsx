'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Code2, ExternalLink } from 'lucide-react'

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

export default function ProjectsClient({ projects, allTags }: {
  projects: Project[]
  allTags: Tag[]
}) {
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = projects.filter((p) => {
    const matchesQ = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    const matchesTag = !activeTag || p.tags.some((t) => t.id === activeTag)
    return matchesQ && matchesTag
  })

  return (
    <div>
      <div className="space-y-3 mb-8">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects…"
          className="w-full sm:w-72 px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
        />
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setActiveTag(activeTag === tag.id ? '' : tag.id)}
                className={[
                  'text-xs px-3 py-1 rounded-full border transition-colors',
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
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col hover:border-[var(--accent)] transition-colors"
            >
              {p.imageUrl && (
                <div className="relative h-40 w-full bg-[var(--background)]">
                  <Image src={p.imageUrl} alt={p.title} fill className="object-cover" />
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-semibold text-[var(--foreground)] mb-1">{p.title}</h3>
                <p className="text-sm text-[var(--muted)] mb-4 flex-1">{p.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {p.tech.map((t) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--muted)]">
                      {t}
                    </span>
                  ))}
                </div>
                {p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.tags.map((tag) => (
                      <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full border border-[var(--accent)] text-[var(--accent)]">
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-3">
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
          ))}
        </ul>
      )}
    </div>
  )
}
