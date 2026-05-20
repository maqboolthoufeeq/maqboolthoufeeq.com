import Link from 'next/link'
import ProjectList from '@/components/admin/ProjectList'
import { prisma } from '@/lib/prisma'

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { order: 'asc' },
    select: { id: true, title: true, featured: true, order: true },
  })

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">← Dashboard</Link>
          <span className="text-[var(--border)]">/</span>
          <h1 className="font-semibold text-[var(--foreground)]">Projects</h1>
        </div>
        <Link
          href="/admin/projects/new"
          className="px-4 py-1.5 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          New project
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <ProjectList initialProjects={projects} />
      </main>
    </div>
  )
}
