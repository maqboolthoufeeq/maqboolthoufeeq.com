import AdminShell from '@/components/admin/AdminShell'
import MediaCategoryManager from '@/components/admin/MediaCategoryManager'

export default function MediaCategoriesPage() {
  return (
    <AdminShell title="Topics" back="/admin/media">
      <p className="max-w-2xl mx-auto text-sm text-[var(--muted)] mb-5">
        Topics are the playlist-style rows shown on your{' '}
        <span className="text-[var(--foreground)]">Reels</span> and{' '}
        <span className="text-[var(--foreground)]">Videos</span> pages. Assign each reel or video to a
        topic from its edit screen. Drag the arrows to set the order topics appear in.
      </p>
      <MediaCategoryManager />
    </AdminShell>
  )
}
