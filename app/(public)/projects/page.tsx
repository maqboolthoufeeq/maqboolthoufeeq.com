import Navbar from '@/components/Navbar'
import ProjectsClient from '@/components/sections/ProjectsClient'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Projects — Maqbool Thoufeeq',
  description: 'A collection of projects built across web development and engineering.',
}

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: [{ featured: 'desc' }, { order: 'asc' }],
    include: { tags: { select: { id: true, name: true } } },
  })

  const tagMap = new Map<string, { id: string; name: string }>()
  for (const p of projects) {
    for (const t of p.tags) tagMap.set(t.id, t)
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Projects</h1>
        <div className="w-10 h-0.5 bg-[var(--accent)] mb-10" />

        {projects.length === 0 ? (
          <p className="text-[var(--muted)]">No projects yet. Check back soon.</p>
        ) : (
          <ProjectsClient projects={projects} allTags={[...tagMap.values()]} />
        )}
      </main>
    </>
  )
}
