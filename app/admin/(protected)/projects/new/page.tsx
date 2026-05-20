import Link from 'next/link'
import ProjectForm from '@/components/admin/ProjectForm'

export default function NewProjectPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] px-6 h-14 flex items-center gap-3">
        <Link href="/admin/projects" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">← Projects</Link>
        <span className="text-[var(--border)]">/</span>
        <h1 className="font-semibold text-[var(--foreground)]">New Project</h1>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-10">
        <ProjectForm />
      </main>
    </div>
  )
}
