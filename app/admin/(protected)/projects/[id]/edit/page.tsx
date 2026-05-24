import ProjectForm from '@/components/admin/ProjectForm'
import AdminShell from '@/components/admin/AdminShell'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

type Props = { params: Promise<{ id: string }> }

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id },
    include: { tags: true },
  })
  if (!project) notFound()

  const initial = {
    title: project.title,
    description: project.description,
    tech: project.tech.join(', '),
    liveUrl: project.liveUrl ?? '',
    repoUrl: project.repoUrl ?? '',
    imageUrl: project.imageUrl ?? '',
    images: project.images,
    featured: project.featured,
    tagIds: project.tags.map((t) => t.id),
  }

  return (
    <AdminShell title="Edit project" back="/admin/projects">
      <div className="max-w-2xl mx-auto">
        <ProjectForm projectId={id} initial={initial} />
      </div>
    </AdminShell>
  )
}
