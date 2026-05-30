import Link from 'next/link'
import { FileText, Folder, Tags, Inbox, Layout, Palette, Cpu, BarChart3, Users, Eye, ChevronRight, LogOut } from 'lucide-react'
import { signOutAction } from '@/lib/admin-actions'
import { prisma } from '@/lib/prisma'
import { getSiteStats } from '@/lib/analytics'
import AdminShell from '@/components/admin/AdminShell'

export default async function AdminDashboard() {
  const [postCount, publishedCount, projectCount, tagCount, unreadContacts, stats] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { published: true } }),
    prisma.project.count(),
    prisma.tag.count(),
    prisma.contactRequest.count({ where: { read: false } }),
    getSiteStats(),
  ])

  return (
    <AdminShell
      title="Admin"
      active="home"
      action={
        <form action={signOutAction} className="hidden sm:block">
          <button
            type="submit"
            className="tap-scale inline-flex items-center gap-1.5 h-10 px-3 rounded-full text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </form>
      }
    >
      <div className="space-y-6 sm:space-y-8">
        {/* Hero / greeting */}
        <section className="pt-2">
          <p className="text-xs uppercase tracking-wider text-[var(--muted)] font-medium">
            Dashboard
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mt-1">
            Welcome back
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Here&rsquo;s what&rsquo;s happening on your site.
          </p>
        </section>

        {/* Stats — 2 columns on mobile, 4 on desktop. Each links to its section. */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Total posts" value={postCount} href="/admin/posts" />
          <StatCard label="Published" value={publishedCount} href="/admin/posts" />
          <StatCard label="Projects" value={projectCount} href="/admin/projects" />
          <StatCard label="Tags" value={tagCount} href="/admin/tags" />
        </section>

        {/* Traffic — visitor analytics, links through to the full page */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs uppercase tracking-wider text-[var(--muted)] font-medium">Traffic</h3>
            <Link href="/admin/analytics" className="text-xs text-[var(--accent)] hover:underline">
              View analytics →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <TrafficCard icon={Users} label="Unique visitors" value={stats.visitors} />
            <TrafficCard icon={Eye} label="Page views" value={stats.pageViews} />
          </div>
        </section>

        {/* Primary actions — large native-feeling rows on mobile, grid on desktop */}
        <section>
          <h3 className="text-xs uppercase tracking-wider text-[var(--muted)] font-medium mb-3 px-1">
            Manage
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <AdminLinkRow
              href="/admin/posts"
              icon={FileText}
              title="Posts"
              description="Create, edit, and publish blog posts"
            />
            <AdminLinkRow
              href="/admin/projects"
              icon={Folder}
              title="Projects"
              description="Add and order portfolio projects"
            />
            <AdminLinkRow
              href="/admin/contact"
              icon={Inbox}
              title="Inbox"
              description="View messages from the contact form"
              badge={unreadContacts > 0 ? unreadContacts : undefined}
            />
            <AdminLinkRow
              href="/admin/site-content"
              icon={Layout}
              title="Landing page"
              description="Hero, about, contact, and footer"
            />
            <AdminLinkRow
              href="/admin/analytics"
              icon={BarChart3}
              title="Analytics"
              description="Visitor and page-view counts"
            />
            <AdminLinkRow
              href="/admin/tags"
              icon={Tags}
              title="Tags"
              description="Organise posts and projects"
            />
            <AdminLinkRow
              href="/admin/theme"
              icon={Palette}
              title="Theme & design"
              description="Choose colours and layout style"
            />
            <AdminLinkRow
              href="/admin/mcp"
              icon={Cpu}
              title="MCP"
              description="Tokens, tools, and OAuth clients for the MCP server"
            />
          </ul>
        </section>

        {/* Sign out on mobile (since header omits it) */}
        <section className="sm:hidden pt-2">
          <form action={signOutAction}>
            <button
              type="submit"
              className="tap-scale w-full flex items-center justify-center gap-2 h-12 rounded-2xl border border-[var(--border)] text-red-500 font-medium"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </form>
        </section>
      </div>
    </AdminShell>
  )
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="row-pressable block p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] transition-colors"
    >
      <p className="text-2xl sm:text-3xl font-bold text-[var(--accent)] tabular-nums">{value}</p>
      <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">{label}</p>
    </Link>
  )
}

function TrafficCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number }>
  label: string
  value: number
}) {
  return (
    <Link
      href="/admin/analytics"
      className="row-pressable flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] transition-colors"
    >
      <span className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[var(--background)] flex items-center justify-center text-[var(--accent)]">
        <Icon size={20} />
      </span>
      <span className="min-w-0">
        <span className="block text-2xl sm:text-3xl font-bold text-[var(--foreground)] tabular-nums leading-none">
          {value.toLocaleString('en-US')}
        </span>
        <span className="block text-xs sm:text-sm text-[var(--muted)] mt-1 truncate">{label}</span>
      </span>
    </Link>
  )
}

function AdminLinkRow({
  href,
  icon: Icon,
  title,
  description,
  badge,
}: {
  href: string
  icon: React.ComponentType<{ size?: number }>
  title: string
  description: string
  badge?: number
}) {
  return (
    <li>
      <Link
        href={href}
        className="row-pressable flex items-center gap-3 sm:gap-4 p-3 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] transition-colors"
      >
        <span className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[var(--background)] flex items-center justify-center text-[var(--accent)]">
          <Icon size={22} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-semibold text-[var(--foreground)] truncate">
              {title}
            </span>
            {badge !== undefined && (
              <span className="shrink-0 text-[10px] sm:text-xs font-bold bg-[var(--accent)] text-white px-1.5 sm:px-2 py-0.5 rounded-full min-w-[18px] text-center">
                {badge}
              </span>
            )}
          </span>
          <span className="block text-xs sm:text-sm text-[var(--muted)] truncate mt-0.5">
            {description}
          </span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-[var(--muted)] sm:hidden" />
      </Link>
    </li>
  )
}
