import Link from 'next/link'
import { signOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function AdminDashboard() {
  const [postCount, publishedCount, projectCount, tagCount] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { published: true } }),
    prisma.project.count(),
    prisma.tag.count(),
  ])

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] px-6 h-14 flex items-center justify-between">
        <h1 className="font-semibold text-[var(--foreground)]">Admin</h1>
        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/admin/login' })
          }}
        >
          <button type="submit" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
            Sign out
          </button>
        </form>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid sm:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total posts" value={postCount} />
          <StatCard label="Published posts" value={publishedCount} />
          <StatCard label="Projects" value={projectCount} />
          <StatCard label="Tags" value={tagCount} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <AdminLink href="/admin/posts" title="Manage Posts" description="Create, edit, and publish blog posts" />
          <AdminLink href="/admin/projects" title="Manage Projects" description="Add and order portfolio projects" />
          <AdminLink href="/admin/site-content" title="Edit Landing Page" description="Update hero, about, contact, and footer content" />
          <AdminLink href="/admin/tags" title="Manage Tags" description="Create and organise tags for posts and projects" />
          <AdminLink href="/admin/theme" title="Theme" description="Choose a colour theme for your site" />
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <p className="text-3xl font-bold text-[var(--accent)]">{value}</p>
      <p className="text-sm text-[var(--muted)] mt-1">{label}</p>
    </div>
  )
}

function AdminLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] transition-colors block"
    >
      <h2 className="font-semibold text-[var(--foreground)] mb-1">{title}</h2>
      <p className="text-sm text-[var(--muted)]">{description}</p>
    </Link>
  )
}
