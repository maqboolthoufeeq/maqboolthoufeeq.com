import { Suspense } from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ProjectsGrid from './ProjectsGrid'

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
        <Suspense fallback={null}>
          <ProjectsGrid projects={projects} />
        </Suspense>
      )}
    </section>
  )
}
