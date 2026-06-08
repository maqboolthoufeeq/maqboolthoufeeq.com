import { buildIconResponse } from '@/lib/site-icon'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 180px is the size iOS Safari uses for the home-screen / "Add to Home Screen"
// touch icon. Next auto-injects <link rel="apple-touch-icon" href="/apple-icon" />.
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default async function AppleIcon() {
  return buildIconResponse(size.width)
}
