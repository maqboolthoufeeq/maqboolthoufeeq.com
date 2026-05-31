import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import Navbar from '@/components/Navbar'
import ProjectsClient from '@/components/sections/ProjectsClient'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getRequestOrigin } from '@/lib/request-origin'
import { getSeo } from '@/lib/site-content'
import { buildPageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const [origin, seo] = await Promise.all([getRequestOrigin(), getSeo()])
  return buildPageMetadata({
    origin,
    title: `Projects — ${seo.siteName}`,
    description: 'A collection of projects built across web development and engineering.',
    path: '/projects',
    ogTitle: 'Projects',
    siteName: seo.siteName,
  })
}

export default async function ProjectsPage() {
  const [projects, session] = await Promise.all([
    prisma.project.findMany({
      orderBy: [{ featured: 'desc' }, { order: 'asc' }],
      include: { tags: { select: { id: true, name: true } } },
    }),
    auth(),
  ])
  const isAdmin = !!session

  const tagMap = new Map<string, { id: string; name: string }>()
  for (const p of projects) {
    for (const t of p.tags) tagMap.set(t.id, t)
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Projects</h1>
          {isAdmin && (
            <Link
              href="/admin/projects/new"
              className="tap-scale inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus size={18} strokeWidth={2.4} />
              <span className="hidden sm:inline">Add Project</span>
            </Link>
          )}
        </div>
        <div className="w-10 h-0.5 bg-[var(--accent)] mb-10" />

        {projects.length === 0 ? (
          <p className="text-[var(--muted)]">No projects yet. Check back soon.</p>
        ) : (
          <Suspense fallback={null}>
            <ProjectsClient projects={projects} allTags={[...tagMap.values()]} isAdmin={isAdmin} />
          </Suspense>
        )}
      </main>
    </>
  )
}
