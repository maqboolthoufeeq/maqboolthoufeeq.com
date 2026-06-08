import type { MetadataRoute } from 'next'
import { getSeo } from '@/lib/site-content'

// Resolved from admin-editable identity, so the installed PWA / Android app
// carries the owner's name, tagline and photo icon. force-dynamic because it
// reads the live site identity.
export const dynamic = 'force-dynamic'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  // Degrade to a generic manifest on a transient DB error rather than 500'ing
  // the /manifest.webmanifest endpoint.
  let seo: { siteName: string; role: string; tagline: string }
  try {
    seo = await getSeo()
  } catch {
    seo = { siteName: 'Portfolio', role: '', tagline: 'Personal portfolio and blog.' }
  }
  return {
    name: seo.role ? `${seo.siteName} — ${seo.role}` : seo.siteName,
    short_name: seo.siteName,
    description: seo.tagline,
    start_url: '/',
    display: 'standalone',
    background_color: '#0d0d0f',
    theme_color: '#0d0d0f',
    icons: [
      // purpose 'any' (not 'maskable'): the photo is full-bleed with no safe
      // margin, so we let launchers letterbox rather than crop the face.
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
