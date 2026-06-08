import { buildIconResponse } from '@/lib/site-icon'

// nodejs runtime: buildIconResponse fetches the remote photo and base64-inlines
// it with Buffer. force-dynamic: the icon is resolved from admin-editable DB
// content, so it always reflects the current profile photo.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// A single 512px square: Google downsamples to the 48/32/16px it displays, and
// the same asset doubles as the PWA / Android icon. Next auto-injects
// <link rel="icon" type="image/png" sizes="512x512" href="/icon?<hash>" />.
export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default async function Icon() {
  return buildIconResponse(size.width)
}
