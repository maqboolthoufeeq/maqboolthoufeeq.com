import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import AdminShell from '@/components/admin/AdminShell'
import BannerManager from '@/components/admin/BannerManager'

export default function AdminBannersPage() {
  return (
    <AdminShell
      title="Announcements"
      back="/admin"
      action={
        <Link
          href="/announcements"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View public history"
          className="tap-scale w-11 h-11 flex items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
        >
          <ExternalLink size={18} />
        </Link>
      }
    >
      <div className="space-y-2">
        <p className="text-sm text-[var(--muted)] max-w-2xl mx-auto">
          Add a notice that appears as a dismissible bar on top of your landing page. The newest
          active one is shown; every announcement is kept in a public{' '}
          <Link href="/announcements" className="text-[var(--accent)] hover:underline">history</Link>.
        </p>
        <BannerManager />
      </div>
    </AdminShell>
  )
}
