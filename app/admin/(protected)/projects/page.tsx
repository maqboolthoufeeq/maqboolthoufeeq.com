import Link from 'next/link'
import { Plus } from 'lucide-react'
import ProjectList from '@/components/admin/ProjectList'
import AdminShell from '@/components/admin/AdminShell'
import { prisma } from '@/lib/prisma'

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { order: 'asc' },
    select: { id: true, title: true, featured: true, order: true },
  })

  return (
    <AdminShell
      title="Projects"
      back="/admin"
      active="projects"
      action={
        <Link
          href="/admin/projects/new"
          aria-label="New project"
          className="tap-scale inline-flex items-center justify-center h-10 px-3 sm:px-4 rounded-full bg-[var(--accent)] text-white text-sm font-medium gap-1.5 hover:opacity-90"
        >
          <Plus size={18} strokeWidth={2.4} />
          <span className="hidden sm:inline">New project</span>
        </Link>
      }
    >
      <ProjectList initialProjects={projects} />
    </AdminShell>
  )
}
