import { prisma } from '@/lib/prisma'
import ProjectsClient from './ProjectsClient'

export default async function Projects() {
  const projects = await prisma.project.findMany({
    where: { featured: true },
    orderBy: { order: 'asc' },
    include: { tags: { select: { id: true, name: true } } },
  })

  const tagMap = new Map<string, { id: string; name: string }>()
  for (const p of projects) {
    for (const t of p.tags) tagMap.set(t.id, t)
  }

  return (
    <section id="projects" className="max-w-5xl mx-auto px-4 py-20">
      <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Projects</h2>
      <div className="w-10 h-0.5 bg-[var(--accent)] mb-10" />

      {projects.length === 0 ? (
        <p className="text-[var(--muted)]">No featured projects yet.</p>
      ) : (
        <ProjectsClient projects={projects} allTags={[...tagMap.values()]} />
      )}
    </section>
  )
}
