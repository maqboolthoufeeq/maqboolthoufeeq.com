'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Code2, ExternalLink } from 'lucide-react'
import ProjectDetailModal, { useOpenProject, type ProjectDetail } from './ProjectDetailModal'

export type ProjectItem = ProjectDetail

const TECH_LIMIT = 3

export default function ProjectsGrid({ projects }: { projects: ProjectItem[] }) {
  const openProject = useOpenProject()

  return (
    <>
      {/* ── Grid ─────────────────────────────────────────────────── */}
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => {
          const extraTech = Math.max(0, p.tech.length - TECH_LIMIT)
          return (
            <li
              key={p.id}
              onClick={() => openProject(p.id)}
              className="cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col hover:border-[var(--accent)] transition-colors"
            >
              {p.imageUrl && (
                <div className="relative h-40 w-full bg-[var(--background)]">
                  <Image src={p.imageUrl} alt={p.title} fill className="object-cover" unoptimized />
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-semibold text-[var(--foreground)] mb-1">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openProject(p.id) }}
                    className="text-left hover:text-[var(--accent)] transition-colors focus:outline-none focus-visible:underline"
                  >
                    {p.title}
                  </button>
                </h3>
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

      {/* URL-driven detail modal + lightbox (shared with the /projects list) */}
      <ProjectDetailModal projects={projects} />
    </>
  )
}
