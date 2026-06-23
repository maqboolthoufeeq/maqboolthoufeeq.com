import type { IntegrationCategory, IntegrationProvider } from '../types'

/**
 * Link-only providers: platforms with NO safe official API for posting our content, so
 * we deliberately DON'T auto-post to them — we only store a profile link for display.
 * This is the ban-safe choice the user explicitly asked for: Instagram, TikTok, YouTube,
 * Substack, etc. ban accounts that use unofficial automation, so we never touch them
 * programmatically. Each card explains *why* in-product.
 */
interface LinkOnlySpec {
  id: string
  name: string
  category: IntegrationCategory
  icon: string
  brandColor: string
  reason: string
  profileHint: string
}

function makeLinkOnly(spec: LinkOnlySpec): IntegrationProvider {
  return {
    id: spec.id,
    name: spec.name,
    category: spec.category,
    capability: 'linkOnly',
    icon: spec.icon,
    brandColor: spec.brandColor,
    fields: [
      {
        key: 'profileUrl',
        label: 'Profile URL',
        type: 'url',
        required: false,
        secret: false,
        help: spec.profileHint,
      },
    ],
    docs: {
      summary: `Saves your ${spec.name} profile link. Auto-posting is intentionally disabled here.`,
      steps: [
        `Paste your public ${spec.name} profile/page URL above.`,
        'It is stored for reference and can be shown as a social link — nothing is ever posted automatically.',
      ],
      links: [],
      banSafety: spec.reason,
    },
    // No test()/publish() — the cross-post button skips link-only providers by design.
  }
}

export const linkOnlyProviders: IntegrationProvider[] = [
  makeLinkOnly({
    id: 'instagram', name: 'Instagram', category: 'social', icon: 'Camera', brandColor: '#e4405f',
    profileHint: 'e.g. https://instagram.com/yourname',
    reason: 'Instagram has NO official API for posting normal feed content from a personal account — the Graph API only covers Business/Creator accounts for media with a hosted URL, and unofficial automation gets accounts permanently banned by Meta. So this is link-only and never auto-posts.',
  }),
  makeLinkOnly({
    id: 'instagram_reels', name: 'Instagram Reels', category: 'video', icon: 'Clapperboard', brandColor: '#e4405f',
    profileHint: 'e.g. https://instagram.com/yourname/reels',
    reason: 'The Reels publishing API is restricted to approved partners/Business accounts; automating uploads from a personal account violates Meta\'s terms and risks a ban. Link-only by design.',
  }),
  makeLinkOnly({
    id: 'tiktok', name: 'TikTok', category: 'video', icon: 'Music2', brandColor: '#000000',
    profileHint: 'e.g. https://tiktok.com/@yourname',
    reason: 'TikTok has no official personal-account posting API; unofficial automation is strictly prohibited and enforcement (account + IP bans) is swift. Link-only — never automated.',
  }),
  makeLinkOnly({
    id: 'youtube', name: 'YouTube', category: 'video', icon: 'Play', brandColor: '#ff0000',
    profileHint: 'e.g. https://youtube.com/@yourchannel',
    reason: 'The YouTube Data API can upload videos, but auto-publishing without manual review risks channel strikes, and a blog post isn\'t a video anyway. Stored as a link only (use the Social media section for curated videos).',
  }),
  makeLinkOnly({
    id: 'youtube_shorts', name: 'YouTube Shorts', category: 'video', icon: 'Film', brandColor: '#ff0000',
    profileHint: 'e.g. https://youtube.com/@yourchannel/shorts',
    reason: 'Shorts uploads need manual review; third-party auto-upload tools risk strikes. Link-only.',
  }),
  makeLinkOnly({
    id: 'twitch', name: 'Twitch', category: 'video', icon: 'Gamepad2', brandColor: '#9146ff',
    profileHint: 'e.g. https://twitch.tv/yourname',
    reason: 'Twitch\'s API is for stream notifications, not posting articles. Auto-streaming bots get suspended. Link-only.',
  }),
  makeLinkOnly({
    id: 'vimeo', name: 'Vimeo', category: 'video', icon: 'Video', brandColor: '#1ab7ea',
    profileHint: 'e.g. https://vimeo.com/yourname',
    reason: 'Vimeo\'s upload API exists but high-frequency automated posting is a ToS gray zone that can get accounts flagged. Kept link-only to stay safe.',
  }),
  makeLinkOnly({
    id: 'substack', name: 'Substack', category: 'newsletter', icon: 'Mail', brandColor: '#ff6719',
    profileHint: 'e.g. https://yourname.substack.com',
    reason: 'Substack has no official public write API; the only way to "auto-post" would be unofficial automation that risks your account. Link-only — publish there manually.',
  }),
  makeLinkOnly({
    id: 'medium', name: 'Medium', category: 'blog', icon: 'BookOpen', brandColor: '#000000',
    profileHint: 'e.g. https://medium.com/@yourname',
    reason: 'Medium archived its publishing API in March 2023 and issues no new integration tokens, so reliable auto-publishing isn\'t possible. Stored as a link; cross-post to dev.to/Hashnode instead.',
  }),
  makeLinkOnly({
    id: 'quora', name: 'Quora', category: 'qa', icon: 'HelpCircle', brandColor: '#b92b27',
    profileHint: 'e.g. https://quora.com/profile/yourname',
    reason: 'Quora has no official posting API and actively bans bot accounts that scrape or auto-post. Link-only.',
  }),
  makeLinkOnly({
    id: 'answer_overflow', name: 'Answer Overflow', category: 'qa', icon: 'Quote', brandColor: '#38bdf8',
    profileHint: 'e.g. https://answeroverflow.com/...',
    reason: 'Answer Overflow indexes Discord help content; it has no publish API. Link-only.',
  }),
  makeLinkOnly({
    id: 'g2', name: 'G2', category: 'review', icon: 'Star', brandColor: '#ff492c',
    profileHint: 'e.g. https://g2.com/products/yourproduct',
    reason: 'G2 is a reviews platform with no content-posting API; automating reviews is prohibited. Link-only.',
  }),
  makeLinkOnly({
    id: 'github', name: 'GitHub', category: 'code', icon: 'Code2', brandColor: '#181717',
    profileHint: 'e.g. https://github.com/yourname',
    reason: 'GitHub is for code, not blog posts — auto-publishing articles there isn\'t meaningful. Stored as a "proof of work" profile link.',
  }),
]
