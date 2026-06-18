import { getActiveBanner } from '@/lib/banners'
import AnnouncementBar from './AnnouncementBar'

/**
 * Server wrapper for the top-of-site announcement bar. Reads the newest active
 * banner and hands it to the dismissible client bar. Renders nothing when there
 * is no active announcement.
 */
export default async function AnnouncementBanner() {
  const banner = await getActiveBanner()
  if (!banner) return null
  return <AnnouncementBar banner={banner} />
}
