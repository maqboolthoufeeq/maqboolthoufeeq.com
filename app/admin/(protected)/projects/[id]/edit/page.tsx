import Link from 'next/link'
import ProjectForm from '@/components/admin/ProjectForm'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

type Props = { params: Promise<{ id: string }> }

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) notFound()

  const initial = {
    title: project.title,
    description: project.description,
    tech: project.tech.join(', '),
    liveUrl: project.liveUrl ?? '',
    repoUrl: project.repoUrl ?? '',
    imageUrl: project.imageUrl ?? '',
    featured: project.featured,
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] px-6 h-14 flex items-center gap-3">
        <Link href="/admin/projects" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">← Projects</Link>
        <span className="text-[var(--border)]">/</span>
        <h1 className="font-semibold text-[var(--foreground)]">Edit Project</h1>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-10">
        <ProjectForm projectId={id} initial={initial} />
      </main>
    </div>
  )
}
