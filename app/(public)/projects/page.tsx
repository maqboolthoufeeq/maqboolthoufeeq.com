import Navbar from '@/components/Navbar'
import ProjectsClient from '@/components/sections/ProjectsClient'
import { prisma } from '@/lib/prisma'
import { getRequestOrigin } from '@/lib/request-origin'
import { SITE_NAME, buildPageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const origin = await getRequestOrigin()
  return buildPageMetadata({
    origin,
    title: `Projects — ${SITE_NAME}`,
    description: 'A collection of projects built across web development and engineering.',
    path: '/projects',
    ogTitle: 'Projects',
  })
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
