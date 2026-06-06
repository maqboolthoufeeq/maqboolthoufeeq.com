import MediaForm from '@/components/admin/MediaForm'
import AdminShell from '@/components/admin/AdminShell'
import { isPlatform, type Platform } from '@/lib/social'

type Props = { searchParams: Promise<{ platform?: string; category?: string; from?: string }> }

/** Only accept in-app relative paths as the return target (no open redirects). */
function safePath(p?: string): string | undefined {
  return p && p.startsWith('/') && !p.startsWith('//') ? p : undefined
}

export default async function NewMediaPage({ searchParams }: Props) {
  const { platform, category, from } = await searchParams
  const defaultPlatform: Platform = isPlatform(platform) ? platform : 'instagram'
  const returnTo = safePath(from)

  return (
    <AdminShell title="Add to social media" back={returnTo ?? '/admin/media'}>
      <div className="max-w-2xl mx-auto">
        <MediaForm
          defaultPlatform={defaultPlatform}
          initial={category ? { categoryId: category } : undefined}
          returnTo={returnTo}
        />
      </div>
    </AdminShell>
  )
}
