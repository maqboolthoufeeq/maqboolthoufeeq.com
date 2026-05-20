import Link from 'next/link'
import Image from 'next/image'
import { Code2, ExternalLink } from 'lucide-react'
import { prisma } from '@/lib/prisma'

export default async function Projects() {
  const projects = await prisma.project.findMany({
    where: { featured: true },
    orderBy: { order: 'asc' },
    include: { tags: { select: { id: true, name: true } } },
  })

  return (
    <section id="projects" className="max-w-5xl mx-auto px-4 py-20">
      <div className="flex items-end justify-between mb-2">
        <h2 className="text-2xl font-bold text-[var(--foreground)]">Projects</h2>
        <Link href="/projects" className="text-sm text-[var(--accent)] hover:underline">
          All projects →
        </Link>
      </div>
      <div className="w-10 h-0.5 bg-[var(--accent)] mb-10" />

      {projects.length === 0 ? (
        <p className="text-[var(--muted)]">No featured projects yet.</p>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
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
                {p.tech.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.tech.map((t) => (
                      <span
                        key={t}
                        className="text-xs px-2 py-0.5 rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--muted)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs px-2 py-0.5 rounded-full border border-[var(--accent)] text-[var(--accent)]"
                      >
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-3">
                  {p.liveUrl && (
                    <Link
                      href={p.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
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
                    >
                      <Code2 size={14} /> Code
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
