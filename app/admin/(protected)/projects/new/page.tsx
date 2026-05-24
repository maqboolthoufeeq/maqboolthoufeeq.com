import ProjectForm from '@/components/admin/ProjectForm'
import AdminShell from '@/components/admin/AdminShell'

export default function NewProjectPage() {
  return (
    <AdminShell title="New project" back="/admin/projects">
      <div className="max-w-2xl mx-auto">
        <ProjectForm />
      </div>
    </AdminShell>
  )
}
